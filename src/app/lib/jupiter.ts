import { VersionedTransaction } from '@solana/web3.js';
import { SLIPPAGE_BPS } from './config';

const BASE = 'https://lite-api.jup.ag';

export type Price = {
  usd: number;
  change24h: number | null;
  /** xStocks use Token-2022 scaled UI amounts: displayed shares = raw units x multiplier */
  multiplier: number;
};

type PriceRow = {
  usdPrice?: number;
  priceChange24h?: number;
  scaledUiConfig?: { multiplier?: number | string };
};

/** USD prices for up to 50 mints in one request. */
export async function fetchPrices(mints: string[]): Promise<Record<string, Price>> {
  const res = await fetch(`${BASE}/price/v3?ids=${mints.join(',')}`);
  if (!res.ok) throw new Error(`Price feed error (${res.status})`);
  const json = (await res.json()) as Record<string, PriceRow | null>;
  const out: Record<string, Price> = {};
  for (const mint of mints) {
    const row = json[mint];
    if (!row?.usdPrice) continue;
    out[mint] = {
      usd: row.usdPrice,
      change24h: row.priceChange24h ?? null,
      multiplier: Number(row.scaledUiConfig?.multiplier ?? 1) || 1,
    };
  }
  return out;
}

export type Quote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  routePlan: { swapInfo: { label?: string } }[];
  [k: string]: unknown;
};

export async function fetchQuote(p: { inputMint: string; outputMint: string; amount: bigint; exactOut?: boolean }, signal?: AbortSignal): Promise<Quote> {
  const q = new URLSearchParams({
    inputMint: p.inputMint,
    outputMint: p.outputMint,
    amount: p.amount.toString(),
    slippageBps: String(SLIPPAGE_BPS),
    swapMode: p.exactOut ? 'ExactOut' : 'ExactIn',
  });
  const res = await fetch(`${BASE}/swap/v1/quote?${q}`, { signal });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `No route found (${res.status})`);
  return json as Quote;
}

/** Builds the swap as a versioned transaction for the user's wallet to sign. */
export async function fetchSwapTransaction(quote: Quote, userPublicKey: string) {
  const res = await fetch(`${BASE}/swap/v1/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 1_000_000, priorityLevel: 'high' } },
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.swapTransaction) throw new Error(json.error || 'Could not build the swap');
  const bytes = Uint8Array.from(atob(json.swapTransaction as string), (c) => c.charCodeAt(0));
  return { tx: VersionedTransaction.deserialize(bytes), lastValidBlockHeight: json.lastValidBlockHeight as number };
}
