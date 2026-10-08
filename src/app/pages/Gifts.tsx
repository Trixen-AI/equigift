import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PublicKey } from '@solana/web3.js';
import { Download, ExternalLink, Link2, Loader2, Undo2, Upload } from 'lucide-react';
import { statusOf, useGiftStates, usePrices, useRefreshChain, useWallet, type GiftStatus } from '../hooks/data';
import { giftStore, useGiftStore, type SentGift } from '../lib/giftStore';
import { STOCK_BY_MINT, explorerAccount, explorerTx } from '../lib/config';
import { keypairFromString } from '../lib/giftLink';
import { sweepGift } from '../lib/solana';
import { date, errorText, rawToShares, shares, usd } from '../lib/format';
import { ConnectGate, Notice, PageHead, StatusPill, StockBadge } from '../components/Common';
import { occasionName } from '../lib/occasion';
import { SharePanel } from '../components/SharePanel';

type Filter = 'all' | GiftStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'opened', label: 'Opened' },
  { key: 'returned', label: 'Taken back' },
];

export default function Gifts() {
  const { address } = useWallet();
  const store = useGiftStore();
  const prices = usePrices();
  const refresh = useRefreshChain();
  const mine = useMemo(() => store.sent.filter((g) => g.sender === address), [store.sent, address]);
  const states = useGiftStates(mine);
  const [filter, setFilter] = useState<Filter>('all');
  const [sharing, setSharing] = useState<SentGift | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!address) {
    return (
      <>
        <PageHead label="Gift tracker" title="Every gift you have sent" />
        <ConnectGate title="Sign in to see your gifts" body="Gifts are listed per wallet. Sign in with the account you used to send them." />
      </>
    );
  }

  if (sharing) {
    const stock = STOCK_BY_MINT.get(sharing.mint)!;
    return (
      <>
        <PageHead label="Gift tracker" title="Share this gift again">
          <button className="btn btn-sec" onClick={() => setSharing(null)}>Back to all gifts</button>
        </PageHead>
        <SharePanel link={sharing.link} stock={stock} sharesAmount={sharing.shares} usdValue={sharing.shares * (prices.data?.[sharing.mint]?.usd ?? 0)} note={sharing.note} from="" occasion={sharing.occasion} />
      </>
    );
  }

  const rows = mine.map((g) => ({ g, status: statusOf(g, states.data) }));
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  async function takeBack(g: SentGift) {
    if (!address) return;
    setBusy(g.address);
    setMsg(null);
    try {
      const stock = STOCK_BY_MINT.get(g.mint)!;
      const sig = await sweepGift({ gift: keypairFromString(g.secret), mint: g.mint, decimals: stock.decimals, to: new PublicKey(address) });
      giftStore.markReclaimed(g.address, sig);
      setMsg({ tone: 'ok', text: `The ${g.symbol} is back in your wallet. The old link no longer opens anything.` });
    } catch (e) {
      setMsg({ tone: 'error', text: errorText(e) });
    } finally {
      setBusy('');
      refresh();
    }
  }

  function exportBackup() {
    const blob = new Blob([giftStore.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `equigift-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importBackup(file: File) {
    try {
      const n = giftStore.importJson(await file.text());
      setMsg({ tone: 'ok', text: `Restored ${n} gift${n === 1 ? '' : 's'} from the backup.` });
    } catch (e) {
      setMsg({ tone: 'error', text: errorText(e) });
    }
  }

  return (
    <>
      <PageHead label="Gift tracker" title="Every gift you have sent">
        <button className="btn btn-sec btn-sm" onClick={exportBackup} disabled={!store.sent.length}><Download size={15} />Backup</button>
        <button className="btn btn-sec btn-sm" onClick={() => fileRef.current?.click()}><Upload size={15} />Restore</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
      </PageHead>
      <p className="page-note">Gift keys are kept in this browser so you can re-share or take back a gift. Download a backup and keep it private: anyone with the file can open your unclaimed gifts.</p>

      <div className="tabs-row" role="tablist" aria-label="Filter gifts">
        {FILTERS.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key} className={`chip${filter === f.key ? ' is-on' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
            <em>{f.key === 'all' ? rows.length : rows.filter((r) => r.status === f.key).length}</em>
          </button>
        ))}
      </div>

      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}

      {shown.length === 0 ? (
        <div className="card empty">
          <p>{mine.length ? 'Nothing in this list.' : 'You have not sent a gift from this wallet yet.'}</p>
          <Link className="btn btn-pri" to="/app/send">Send a gift</Link>
        </div>
      ) : (
        <ul className="gift-list">
          {shown.map(({ g, status }) => {
            const stock = STOCK_BY_MINT.get(g.mint);
            const pr = prices.data?.[g.mint];
            const liveRaw = states.data?.get(g.address)?.raw;
            const nowShares = status === 'waiting' && liveRaw != null && stock ? rawToShares(liveRaw, stock.decimals, pr?.multiplier) : g.shares;
            return (
              <li key={g.address} className="card gift-item">
                <div className="gift-item-main">
                  {stock ? <StockBadge stock={stock} /> : null}
                  <div className="gift-item-text">
                    <div className="gift-item-title">
                      {shares(nowShares)} {g.symbol}
                      <StatusPill status={status} />
                    </div>
                    <div className="gift-item-sub">
                      {occasionName(g.occasion)} · sent {date(g.createdAt)} · worth {usd(g.usdAtSend)} then, {pr ? usd(nowShares * pr.usd) : '…'} now
                    </div>
                    {g.note ? <p className="gift-item-note">“{g.note}”</p> : null}
                  </div>
                </div>
                <div className="gift-item-actions">
                  {status === 'waiting' ? (
                    <>
                      <button className="btn btn-sec btn-sm" onClick={() => setSharing(g)}><Link2 size={15} />Share link</button>
                      <button className="btn btn-sec btn-sm" onClick={() => takeBack(g)} disabled={!!busy}>
                        {busy === g.address ? <Loader2 className="spin" size={15} /> : <Undo2 size={15} />}Take it back
                      </button>
                    </>
                  ) : null}
                  <a className="btn btn-ghost btn-sm" href={g.reclaimSig ? explorerTx(g.reclaimSig) : explorerAccount(g.address)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={15} />Solscan
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
