import { useMemo } from 'react';
import { Link } from 'react-router';
import { Gift, Ticket } from 'lucide-react';
import { useGiftStates, useHoldings, usePrices, useWallet, statusOf } from '../hooks/data';
import { useGiftStore } from '../lib/giftStore';
import { SOL, STOCKS, STOCK_BY_MINT, USDC } from '../lib/config';
import { date, errorText, pct, rawToShares, shares, usd } from '../lib/format';
import { ConnectGate, Notice, PageHead, StatusPill, StockBadge } from '../components/Common';

export default function Overview() {
  const { address } = useWallet();
  const prices = usePrices();
  const holdings = useHoldings(address);
  const store = useGiftStore();
  const mine = useMemo(() => store.sent.filter((g) => g.sender === address), [store.sent, address]);
  const states = useGiftStates(mine);

  if (!address) {
    return (
      <>
        <PageHead label="Overview" title="Your gifts, at a glance" />
        <ConnectGate title="Sign in to start gifting" body="Connect a Solana wallet, or sign in with email or X. Your portfolio, gifts and links show up here." />
        <MarketList prices={prices.data} />
      </>
    );
  }

  const p = prices.data ?? {};
  const h = holdings.data;
  const solUsd = h ? (h.lamports / 1e9) * (p[SOL.mint]?.usd ?? 0) : 0;
  const usdcUsd = h ? (h.tokens.get(USDC.mint)?.ui ?? 0) * (p[USDC.mint]?.usd ?? 1) : 0;
  const stockUsd = h ? STOCKS.reduce((sum, s) => sum + (h.tokens.get(s.mint)?.ui ?? 0) * (p[s.mint]?.usd ?? 0), 0) : 0;
  const total = solUsd + usdcUsd + stockUsd;

  let waiting = 0;
  let opened = 0;
  let waitingUsd = 0;
  for (const g of mine) {
    const st = statusOf(g, states.data);
    if (st === 'waiting') {
      waiting += 1;
      const stock = STOCK_BY_MINT.get(g.mint);
      const raw = states.data?.get(g.address)?.raw ?? 0n;
      if (stock) waitingUsd += rawToShares(raw, stock.decimals, p[g.mint]?.multiplier) * (p[g.mint]?.usd ?? 0);
    } else if (st === 'opened') opened += 1;
  }

  return (
    <>
      <PageHead label="Overview" title="Your gifts, at a glance" />
      <section className="hero-tile">
        <div className="hero-tile-dots" aria-hidden="true" />
        <div className="hero-tile-main">
          <span className="ds-label hero-tile-label">Wallet value</span>
          <div className="hero-tile-num">{holdings.isLoading || prices.isLoading ? '…' : usd(total)}</div>
          <div className="hero-tile-split">
            <span>Stocks <b>{usd(stockUsd)}</b></span>
            <span>USDC <b>{usd(usdcUsd)}</b></span>
            <span>SOL <b>{usd(solUsd)}</b></span>
          </div>
        </div>
        <div className="hero-tile-cta">
          <Link className="btn btn-pri" to="/app/send"><Gift size={16} />Send a gift</Link>
          <Link className="btn btn-glass" to="/app/claim"><Ticket size={16} />Claim a link</Link>
        </div>
      </section>

      {holdings.error ? <Notice tone="error">Could not read your balances: {errorText(holdings.error)}</Notice> : null}

      <section className="stat-row">
        <Stat label="Gifts sent" value={String(mine.length)} />
        <Stat label="Waiting to be opened" value={String(waiting)} />
        <Stat label="Opened" value={String(opened)} />
        <Stat label="Value still wrapped" value={usd(waitingUsd)} />
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h2>Recent gifts</h2>
            <Link to="/app/gifts" className="card-link">All gifts ›</Link>
          </div>
          {mine.length === 0 ? (
            <div className="empty">
              <p>No gifts yet. Your first one takes about a minute.</p>
              <Link className="btn btn-sec" to="/app/send">Send a gift</Link>
            </div>
          ) : (
            <ul className="rows">
              {mine.slice(0, 5).map((g) => {
                const stock = STOCK_BY_MINT.get(g.mint);
                return (
                  <li key={g.address} className="row">
                    {stock ? <StockBadge stock={stock} size="sm" /> : null}
                    <div className="row-main">
                      <span className="row-title">{shares(g.shares)} {g.symbol}</span>
                      <span className="row-sub">{g.note || 'No note'} · {date(g.createdAt)}</span>
                    </div>
                    <StatusPill status={statusOf(g, states.data)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <MarketList prices={prices.data} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function MarketList({ prices }: { prices: Record<string, { usd: number; change24h: number | null }> | undefined }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Giftable stocks</h2>
        <span className="card-meta">Live prices</span>
      </div>
      <ul className="rows">
        {STOCKS.map((s) => {
          const pr = prices?.[s.mint];
          const ch = pr?.change24h ?? null;
          return (
            <li key={s.mint} className="row">
              <StockBadge stock={s} size="sm" />
              <div className="row-main">
                <span className="row-title">{s.name}</span>
                <span className="row-sub">{s.symbol}</span>
              </div>
              <div className="row-num">
                <span>{pr ? usd(pr.usd) : '…'}</span>
                <span className={`chg ${ch != null && ch < 0 ? 'down' : 'up'}`}>{pct(ch)}</span>
              </div>
              <Link className="btn btn-sec btn-sm" to={`/app/send?stock=${s.symbol}`}>Gift</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
