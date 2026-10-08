import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Lockup } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { NAV } from '@/data/site';

type LinkItem = { icon: string; t: string; d: string; href: string; accent?: boolean; soon?: boolean; tm?: boolean };

function MegaLink({ l }: { l: LinkItem }) {
  const cls = `mega-link${l.accent ? ' mega-link--accent' : ''}${l.soon ? ' mega-link--soon' : ''}`;
  const body = (
    <>
      <span className="mega-ico"><Icon name={l.icon} /></span>
      <span className="mega-tx">
        <span className="t">
          {l.t}
          {l.tm && <sup className="tm">™</sup>}
          {l.soon ? <span className="mega-soon">Soon</span> : <i className="arr">›</i>}
        </span>
        <span className="d">{l.d}</span>
      </span>
    </>
  );
  return l.soon ? <div className={cls}>{body}</div> : <a className={cls} href={l.href}>{body}</a>;
}

function Chev() {
  return <i className="chev">›</i>;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [sec, setSec] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
  }, [open]);

  const g = NAV.gifts;
  const mobileSections = [
    { key: 'gifts', label: g.label, links: [...g.send.links, ...g.soon.links] as LinkItem[] },
    { key: 'stocks', label: NAV.stocks.label, links: NAV.stocks.links as LinkItem[] },
    { key: 'learn', label: NAV.learn.label, links: NAV.learn.links as LinkItem[] },
  ];

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <a className="brand" href="#top" aria-label="Equigift home">
            <Lockup />
          </a>
          <div className="nav-group">
            <div className="nav-item">
              <span className="nav-trigger" tabIndex={0}>{g.label}<Chev /></span>
              <div className="mega mega--cats">
                <div className="mega-cats">
                  <div className="mega-col mega-col--light">
                    <div className="mega-cat-head">{g.send.head}</div>
                    {g.send.links.map((l) => <MegaLink key={l.t} l={l} />)}
                  </div>
                  <div className="mega-col mega-col--dark">
                    <div className="mega-cat-head">{g.soon.head}</div>
                    {g.soon.links.map((l) => <MegaLink key={l.t} l={l} />)}
                  </div>
                </div>
                <div className="mega-cta">
                  <MegaLink l={{ icon: 'sparkles', t: g.cta.t, d: g.cta.d, href: g.cta.href, accent: true }} />
                </div>
              </div>
            </div>
            <div className="nav-item">
              <a className="nav-trigger" href="#stocks">{NAV.stocks.label}<Chev /></a>
              <div className="mega mega--grid">
                {NAV.stocks.links.map((l) => <MegaLink key={l.t} l={l as LinkItem} />)}
              </div>
            </div>
            <div className="nav-item">
              <a className="nav-trigger" href="#guides">{NAV.learn.label}<Chev /></a>
              <div className="mega">
                {NAV.learn.links.map((l) => <MegaLink key={l.t} l={l} />)}
              </div>
            </div>
          </div>
          <div className="nav-right">
            <a className="btn btn-pri" href={NAV.cta.href}>{NAV.cta.label}</a>
            <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>
      <div className={`mobile${open ? ' open' : ''}`} aria-hidden={!open}>
        {mobileSections.map((s) => (
          <div className="m-sec" key={s.key}>
            <button className={`m-head${sec === s.key ? ' open' : ''}`} onClick={() => setSec(sec === s.key ? null : s.key)} aria-expanded={sec === s.key}>
              {s.label}
              <ChevronDown />
            </button>
            <div className="m-panel" style={{ maxHeight: sec === s.key ? s.links.length * 80 : 0 }}>
              {s.links.map((l) => (
                <a key={l.t} className={`m-link${l.accent ? ' m-link--accent' : ''}${l.soon ? ' m-link--soon' : ''}`} href={l.href} onClick={() => setOpen(false)}>
                  <span className="mega-ico"><Icon name={l.icon} size={18} /></span>
                  <span>
                    <span className="t">{l.t}{l.tm && <sup className="tm">™</sup>}</span>
                    <span className="d">{l.d}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
        <a className="btn btn-pri" href={NAV.cta.href} onClick={() => setOpen(false)}>{NAV.cta.label}</a>
      </div>
    </>
  );
}
