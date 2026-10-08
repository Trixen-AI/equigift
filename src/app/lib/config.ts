import type { BrandKey } from '@/components/brand/BrandLogos';

// Giftable stocks: Backed Finance xStocks on Solana mainnet (Token-2022, 8 decimals).
// Mints verified against Jupiter's token API (tags: xstocks, verified).
export type Stock = {
  symbol: 'AAPLx' | 'NVDAx' | 'TSLAx' | 'SPYx';
  name: string;
  short: string;
  mint: string;
  decimals: number;
  logo: BrandKey;
};

export const STOCKS: Stock[] = [
  { symbol: 'AAPLx', name: 'Apple', short: 'AAPL', mint: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp', decimals: 8, logo: 'apple' },
  { symbol: 'NVDAx', name: 'Nvidia', short: 'NVDA', mint: 'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh', decimals: 8, logo: 'nvidia' },
  { symbol: 'TSLAx', name: 'Tesla', short: 'TSLA', mint: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB', decimals: 8, logo: 'tesla' },
  { symbol: 'SPYx', name: 'S&P 500', short: 'SPY', mint: 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W', decimals: 8, logo: 'sp500' },
];

export const STOCK_BY_MINT = new Map(STOCKS.map((s) => [s.mint, s]));
export const STOCK_BY_SYMBOL = new Map(STOCKS.map((s) => [s.symbol, s]));

export const USDC = { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 } as const;
export const SOL = { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 } as const;

// The official public endpoint rejects browser requests (403), so the default is PublicNode,
// which allows browsers. Set VITE_SOLANA_RPC_URL to a dedicated RPC for production traffic.
export const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com';
export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || '';

export const MIN_GIFT_USD = 5;
export const MAX_NOTE = 280;
export const SLIPPAGE_BPS = 100;
/** SOL kept back so the sender can always pay fees after a swap. */
export const SOL_RESERVE_LAMPORTS = 10_000_000;

export const explorerTx = (sig: string) => `https://solscan.io/tx/${sig}`;
export const explorerAccount = (addr: string) => `https://solscan.io/account/${addr}`;
