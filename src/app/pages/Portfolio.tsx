import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Gift, Loader2, X } from 'lucide-react';
import { useHoldings, usePrices, useRefreshChain, useWallet } from '../hooks/data';
import { useGiftStore } from '../lib/giftStore';
import { SOL, STOCKS, USDC, explorerTx, type Stock } from '../lib/config';
import { fetchQuote, fetchSwapTransaction, type Quote } from '../lib/jupiter';
import { sendWithWallet } from '../lib/solana';
import { date, errorText, pct, shares, sol as fmtSol, usd } from '../lib/format';
import { ConnectGate, Notice, PageHead, StockBadge } from '../components/Common';

export default function Portfolio() {
  const { address } = useWallet();
  const prices = usePrices();
  const holdings = useHoldings(address);
  const store = useGiftStore();
  const opened = useMemo(() => store.opened.filter((g) => g.recipient === address), [store.opened, address]);
  const [cashing, setCashing] = useState<Stock | null>(null);

  if (!address) {
    return (
      <>
        <PageHead label="Portfolio" title="What you own" />
        <ConnectGate title="Sign in to see your shares" body="Every stock you received or bought shows up here, with live prices and one-tap cash out." />
      </>
    );
  }

  const p = prices.data ?? {};
  const h = holdings.data;
  const rows = STOCKS.map((s) => {
    const ui = h?.tokens.get(s.mint)?.ui ?? 0;
    return { s, ui, value: ui * (p[s.mint]?.usd ?? 0), price: p[s.mint] };
  });
  const stockTotal = rows.reduce((a, r) => a + r.value, 0);
  const usdc = h?.tokens.get(USDC.mint)?.ui ?? 0;
  const sol = (h?.lamports ?? 0) / 1e9;

  return (
    <>
      <PageHead label="Portfolio" title="What you own">
        <button className="btn btn-sec btn-sm" onClick={() => holdings.refetch()} disabled={holdings.isFetching}>
          {holdings.isFetching ? <Loader2 className="spin" size={15} /> : null}Refresh
        </button>
      </PageHead>

      <section className="stat-row">
        <div className="stat stat--dark">
          <span className="stat-label">Stocks</span>
          <span className="stat-value">{holdings.isLoading ? '…' : usd(stockTotal)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">USDC</span>
          <span className="stat-value">{usd(usdc)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">SOL</span>
          <span className="stat-value">{fmtSol(sol)}</span>
          <span className="stat-sub">{usd(sol * (p[SOL.mint]?.usd ?? 0))}</span>
        </div>
      </section>

      {holdings.error ? <Notice tone="error">Could not read your balances: {errorText(holdings.error)}</Notice> : null}

      <section className="card">
        <div className="card-head">
          <h2>Stocks</h2>
          <span className="card-meta">Tokenized by Backed (xStocks), held in your own wallet</span>
        </div>
        <div className="holdings">
          <div className="holdings-head" aria-hidden="true">
            <span>Stock</span><span>Shares</span><span>Price</span><span>Value</span><span />
          </div>
          {rows.map(({ s, ui, value, price }) => (
            <div key={s.mint} className={`holding${ui === 0 ? ' is-empty' : ''}`}>
              <span className="holding-name">
                <StockBadge stock={s} size="sm" />
                <span><b>{s.name}</b><em>{s.symbol}</em></span>
              </span>
              <span className="holding-cell" data-label="Shares">{shares(ui)}</span>
              <span className="holding-cell" data-label="Price">
                {price ? usd(price.usd) : '…'}
                <em className={`chg ${price?.change24h != null && price.change24h < 0 ? 'down' : 'up'}`}>{pct(price?.change24h ?? null)}</em>
              </span>
              <span className="holding-cell holding-value" data-label="Value">{usd(value)}</span>
              <span className="holding-actions">
                <Link className="btn btn-sec btn-sm" to={`/app/send?stock=${s.symbol}${ui > 0 ? '&pay=holding' : ''}`}><Gift size={14} />{ui > 0 ? 'Gift it' : 'Buy as gift'}</Link>
                {ui > 0 ? <button className="btn btn-ghost btn-sm" onClick={() => setCashing(s)}>Cash out</button> : null}
              </span>
            </div>
          ))}
        </div>
      </section>

      {cashing ? (
        <CashOut key={cashing.mint} stock={cashing} available={h?.tokens.get(cashing.mint)?.raw ?? 0n} ui={h?.tokens.get(cashing.mint)?.ui ?? 0} onClose={() => setCashing(null)} />
      ) : null}

      <section className="card">
        <div className="card-head">
          <h2>Gifts you opened</h2>
          <Link to="/app/claim" className="card-link">Open a link ›</Link>
        </div>
        {opened.length === 0 ? (
          <div className="empty"><p>Gifts you claim with this account appear here.</p></div>
        ) : (
          <ul className="rows">
            {opened.map((g) => (
              <li key={g.address} className="row">
                <div className="row-main">
                  <span className="row-title">{shares(g.shares)} {g.symbol}{g.from ? ` from ${g.from}` : ''}</span>
                  <span className="row-sub">{g.note || 'No note'} · {date(g.openedAt)}</span>
                </div>
                <a className="btn btn-ghost btn-sm" href={explorerTx(g.sig)} target="_blank" rel="noopener noreferrer">Solscan</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

const PORTIONS = [25, 50, 100];

/** Sell shares back to USDC through Jupiter. */
function CashOut({ stock, available, ui, onClose }: { stock: Stock; available: bigint; ui: number; onClose: () => void }) {
  const { address, provider } = useWallet();
  const refresh = useRefreshChain();
  const [portion, setPortion] = useState(100);
  const [state, setState] = useState<{ key: string; quote: Quote | null; error: string }>({ key: '', quote: null, error: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const amount = (available * BigInt(portion)) / 100n;
  const key = `${stock.mint}:${amount}`;
  const quote = state.key === key ? state.quote : null;

  useEffect(() => {
    if (amount <= 0n) return;
    const ac = new AbortController();
    fetchQuote({ inputMint: stock.mint, outputMint: USDC.mint, amount }, ac.signal)
      .then((q) => setState({ key, quote: q, error: '' }))
      .catch((e) => !ac.signal.aborted && setState({ key, quote: null, error: errorText(e) }));
    return () => ac.abort();
  }, [key, amount, stock.mint]);

  async function sell() {
    if (!address || !provider || !quote) return;
    setBusy(true);
    setError('');
    try {
      const fresh = await fetchQuote({ inputMint: stock.mint, outputMint: USDC.mint, amount });
      const { tx } = await fetchSwapTransaction(fresh, address);
      const sig = await sendWithWallet(provider, tx);
      setDone(sig);
      refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card cashout" aria-label={`Cash out ${stock.symbol}`}>
      <div className="card-head">
        <h2>Cash out {stock.name}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>
      {done ? (
        <Notice tone="ok">
          Sold. The USDC is in your wallet. <a href={explorerTx(done)} target="_blank" rel="noopener noreferrer">View on Solscan</a>
        </Notice>
      ) : (
        <>
          <div className="chips">
            {PORTIONS.map((v) => (
              <button key={v} className={`chip${portion === v ? ' is-on' : ''}`} onClick={() => setPortion(v)} disabled={busy}>{v === 100 ? 'All' : `${v}%`}</button>
            ))}
          </div>
          <div className="quote">
            <span className="quote-line">
              Sell <b>{shares((ui * portion) / 100)} {stock.symbol}</b> for about <b>{quote ? usd(Number(quote.outAmount) / 1e6) : '…'}</b> USDC
            </span>
            {state.key === key && state.error ? <span className="quote-meta">{state.error}</span> : <span className="quote-meta">Best route via Jupiter · max slippage 1% · US market hours give the tightest prices</span>}
          </div>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <button className="btn btn-pri" onClick={sell} disabled={!quote || busy}>
            {busy ? <Loader2 className="spin" size={16} /> : null}
            {busy ? 'Confirm in your wallet…' : 'Sell to USDC'}
          </button>
        </>
      )}
    </section>
  );
}
