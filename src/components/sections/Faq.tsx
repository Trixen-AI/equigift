import { useState } from 'react';
import { FAQ, SOCIALS } from '@/data/site';

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" aria-expanded={open} onClick={onToggle}>
        {q}
        <i className="arr">›</i>
      </button>
      <div className="faq-a">
        <div className="faq-a-inner">{a}</div>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const x = SOCIALS[0].href;
  return (
    <section className="sec" id="faq">
      <div className="wrap">
        <div className="sec-head">
          <span className="ds-label">{FAQ.label}</span>
          <h2>
            {FAQ.titleA} <span className="hl">{FAQ.titleHl}</span>
          </h2>
        </div>
        <div className="faq">
          {FAQ.items.map((it, i) => (
            <Item key={it.q} q={it.q} a={it.a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </div>
        <div className="faq-more">
          <h3>{FAQ.more.title}</h3>
          <p>{FAQ.more.body}</p>
          <a className="btn btn-pri" href={x} target="_blank" rel="noopener noreferrer">
            {FAQ.more.cta}
            <i className="arr">›</i>
          </a>
        </div>
      </div>
    </section>
  );
}
