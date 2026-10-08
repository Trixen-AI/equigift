const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const usd = (n: number) => usd2.format(Number.isFinite(n) ? n : 0);

export const shares = (n: number) => {
  if (!Number.isFinite(n) || n === 0) return '0';
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4).replace(/0+$/, '').replace(/\.$/, '');
};

const solFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
/** SOL amount with thousands separators, up to 4 decimals */
export const sol = (n: number) => solFmt.format(Number.isFinite(n) ? n : 0);

export const pct = (n: number | null) => (n == null ? '' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);

export const shortAddr = (a: string) => (a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);

export const date = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** raw on-chain units to displayed shares (xStocks apply a scaled UI multiplier) */
export const rawToShares = (raw: bigint | string, decimals: number, multiplier = 1) => (Number(BigInt(raw)) / 10 ** decimals) * multiplier;

/** displayed shares to raw on-chain units */
export const sharesToRaw = (s: number, decimals: number, multiplier = 1) => BigInt(Math.floor((s / multiplier) * 10 ** decimals));

/** decimal string of a USD/token amount to base units */
export const toBaseUnits = (amount: number, decimals: number) => BigInt(Math.round(amount * 10 ** decimals));

export const errorText = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return 'You cancelled the request in your wallet.';
  if (/insufficient/i.test(m)) return 'Not enough balance to cover this, including network fees.';
  return m.length > 180 ? `${m.slice(0, 180)}…` : m;
};
