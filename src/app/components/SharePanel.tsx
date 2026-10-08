import { useState } from 'react';
import { Link } from 'react-router';
import { Check, Copy, Mail, Share2 } from 'lucide-react';
import { SocialIcon } from '@/components/brand/SocialIcon';
import type { Stock } from '../lib/config';
import { shares as fmtShares } from '../lib/format';
import { GiftCard, QrCode } from './Common';

export function SharePanel({ link, stock, sharesAmount, usdValue, note, from, occasion, onAnother }: { link: string; stock: Stock; sharesAmount: number; usdValue: number; note: string; from: string; occasion: string; onAnother?: () => void }) {
  const [copied, setCopied] = useState(false);
  const message = `I sent you a gift: ${fmtShares(sharesAmount)} ${stock.name} shares. Open it here: ${link}`;
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="send-grid">
      <div className="send-form">
        <section className="card share">
          <h2 className="step-title">Share the link privately</h2>
          <p className="share-warn">Anyone who has this link can open the gift, so send it in a private message, not a public post.</p>
          <div className="linkbox">
            <input readOnly value={link} aria-label="Gift link" onFocus={(e) => e.currentTarget.select()} />
            <button className="btn btn-pri" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <div className="share-actions">
            <a className="btn btn-sec" href={`mailto:?subject=${encodeURIComponent('A gift for you')}&body=${encodeURIComponent(message)}`}><Mail size={16} />Email</a>
            <a className="btn btn-sec" href={`https://x.com/messages/compose?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><SocialIcon name="x" />Message on X</a>
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <button className="btn btn-sec" onClick={() => navigator.share({ title: 'A gift for you', text: message }).catch(() => {})}><Share2 size={16} />More</button>
            ) : null}
          </div>
          <div className="share-qr">
            <QrCode text={link} />
            <p>Printing a card? The QR code opens the same gift.</p>
          </div>
          <div className="share-next">
            <Link className="btn btn-sec" to="/app/gifts">Track this gift</Link>
            {onAnother ? <button className="btn btn-glass-dark" onClick={onAnother}>Send another</button> : null}
          </div>
        </section>
      </div>
      <aside className="send-side">
        <GiftCard stock={stock} sharesAmount={sharesAmount} usdValue={usdValue} note={note} from={from} occasion={occasion} />
      </aside>
    </div>
  );
}
