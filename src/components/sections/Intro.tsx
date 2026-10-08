import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { RibbonScene } from '@/components/scenes/RibbonScene';
import { Rich } from '@/components/ui/Rich';
import { INTRO, OCCASIONS } from '@/data/site';

const fmt = (n: number) => n.toLocaleString('en-US');

export function Intro() {
  const darkRef = useRef<HTMLAnchorElement>(null);
  const [videoIn, setVideoIn] = useState(false);

  // the dark card's scene fades in once the card is well in view
  useEffect(() => {
    const el = darkRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].intersectionRatio >= 0.5) {
          setVideoIn(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const icons = OCCASIONS.map((o) => o.icon);

  return (
    <section className="intro">
      <div className="wrap">
        <span className="ds-label">{INTRO.label}</span>
        <h2>
          {INTRO.titleA} <span className="hl">{INTRO.titleHl}</span> {INTRO.titleB}
        </h2>
        <p>{INTRO.body}</p>
        <div className="intro-cards">
          <a className="intro-card intro-card--light" href={INTRO.stock.href}>
            <h3>{INTRO.stock.title}</h3>
            <p><Rich parts={INTRO.stock.body} /></p>
            <div className="bc-live">
              <div className="bc-count">
                <span className="bc-num">{fmt(INTRO.stock.count)}</span>
                <span className="bc-cap">{INTRO.stock.countCap}</span>
              </div>
              <div className="bc-band" aria-hidden="true">
                <div className="bc-track">
                  {[...icons, ...icons].map((n, i) => (
                    <span className="bc-logo" key={i}><Icon name={n} size={22} strokeWidth={1.6} /></span>
                  ))}
                </div>
              </div>
            </div>
            <span className="ic-link">{INTRO.stock.link}<i className="ic-chev">›</i></span>
          </a>
          <a className={`intro-card intro-card--dark${videoIn ? ' video-in' : ''}`} href={INTRO.pools.href} ref={darkRef}>
            <RibbonScene variant="card" pixel={3} className="ic-video" />
            <h3><span className="bt-name">{INTRO.pools.title}</span><sup className="tm">™</sup></h3>
            <p>{INTRO.pools.body}</p>
            <span className="ic-link">{INTRO.pools.link}<i className="ic-chev">›</i></span>
          </a>
        </div>
      </div>
    </section>
  );
}
