import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { BrandLogo } from '@/components/brand/BrandLogos';
import type { Stock } from '../lib/config';
import { ConnectButton } from './ConnectButton';
import { shares as fmtShares, usd } from '../lib/format';
import type { GiftStatus } from '../hooks/data';
import { occasionName } from '../lib/occasion';

export function StockBadge({ stock, size = 'md' }: { stock: Stock; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`stock-badge stock-badge--${size} stock-badge--${stock.logo}`}>
      <BrandLogo name={stock.logo} />
    </span>
  );
}

export function PageHead({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <span className="ds-label page-label">{label}</span>
        <h1 className="page-title">{title}</h1>
      </div>
      {children ? <div className="page-head-actions">{children}</div> : null}
    </div>
  );
}

export function ConnectGate({ title, body }: { title: string; body: string }) {
  return (
    <div className="gate">
      <div className="gate-art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      <ConnectButton label="Connect or sign in" />
      <span className="gate-hint">Email, X, Google or any Solana wallet</span>
    </div>
  );
}

const STATUS_LABEL: Record<GiftStatus, string> = { waiting: 'Waiting', opened: 'Opened', returned: 'Taken back', checking: 'Checking' };
export function StatusPill({ status }: { status: GiftStatus }) {
  return <span className={`pill pill--${status}`}>{STATUS_LABEL[status]}</span>;
}

/** The gift as the recipient sees it: used for the send preview and the claim page. */
export function GiftCard({ stock, sharesAmount, usdValue, note, from, occasion }: { stock: Stock; sharesAmount: number; usdValue: number; note: string; from?: string; occasion?: string }) {
  return (
    <div className="giftcard">
      <div className="giftcard-top">
        <span className="ds-label giftcard-occ">{occasionName(occasion ?? 'because')}</span>
        <span className="giftcard-ribbon" aria-hidden="true" />
      </div>
      <div className="giftcard-stock">
        <StockBadge stock={stock} size="lg" />
        <div>
          <div className="giftcard-name">{stock.name}</div>
          <div className="giftcard-sym">{stock.symbol} on Solana</div>
        </div>
      </div>
      <div className="giftcard-value">{usd(usdValue)}</div>
      <div className="giftcard-shares">{fmtShares(sharesAmount)} shares</div>
      {note ? <p className="giftcard-note">“{note}”</p> : <p className="giftcard-note giftcard-note--empty">Your note appears here.</p>}
      {from ? <div className="giftcard-from">From {from}</div> : null}
    </div>
  );
}

export function QrCode({ text }: { text: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(text, { margin: 1, width: 360, color: { dark: '#0a0a0b', light: '#ffffff' } }).then((u) => live && setSrc(u));
    return () => {
      live = false;
    };
  }, [text]);
  return src ? <img className="qr" src={src} alt="QR code for the gift link" width={180} height={180} /> : <div className="qr qr--empty" />;
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'ok'; children: ReactNode }) {
  return <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}
