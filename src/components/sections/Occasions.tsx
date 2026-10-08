import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, Pause, Play } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { BrandLogo } from '@/components/brand/BrandLogos';
import { TICKER_LOGO } from '@/components/brand/tickerLogo';
import { SocialIcon } from '@/components/brand/SocialIcon';
import { OCCASIONS, OCCASIONS_HEAD, SOCIALS } from '@/data/site';
import { prefersReducedMotion } from '@/hooks/useInView';

const AUTOPLAY_MS = 8000;
const TICKER_NAME = { AAPL: 'Apple', NVDA: 'Nvidia', TSLA: 'Tesla', SPX: 'S&P 500' } as const;

export function Occasions() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [started, setStarted] = useState(false);
  const [fades, setFades] = useState({ left: false, right: true });
  const panelRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // autoplay begins once the panel is 35% visible
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es[0].isIntersecting && setStarted(true), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !started) return;
    const id = window.setTimeout(() => setIdx((i) => (i + 1) % OCCASIONS.length), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [idx, playing, started]);

  const updateFades = useCallback(() => {
    const r = railRef.current;
    if (!r) return;
    setFades({ left: r.scrollLeft > 4, right: r.scrollLeft + r.clientWidth < r.scrollWidth - 4 });
  }, []);

  // keep the active tab in view inside the rail (without scrolling the page)
  useEffect(() => {
    const rail = railRef.current;
    const tab = tabRefs.current[idx];
    if (!rail || !tab) return;
    const target = tab.offsetLeft - rail.clientWidth / 2 + tab.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [idx]);

  useEffect(() => {
    updateFades();
    window.addEventListener('resize', updateFades);
    return () => window.removeEventListener('resize', updateFades);
  }, [updateFades]);

  const o = OCCASIONS[idx];
  const words = o.note.split(' ');
  const railCls = `comp-tabs${fades.left ? ' fade-left' : ''}${fades.right ? ' fade-right' : ''}${playing && started ? ' playing' : ''}`;

  return (
    <section className="companies" id="occasions">
      <div className="wrap">
        <div className="companies-head">
          <h2>
            {OCCASIONS_HEAD.titleA} <span className="hl">{OCCASIONS_HEAD.titleHl}</span>
          </h2>
          <p>{OCCASIONS_HEAD.body}</p>
          <a className="btn btn-sec companies-cta" href="#guides">
            {OCCASIONS_HEAD.cta}
            <i className="ic-chev">›</i>
          </a>
        </div>
        <div className="panel comp-panel" ref={panelRef}>
          <div className={railCls} ref={railRef} role="tablist" aria-label="Occasions" onScroll={updateFades}>
            {OCCASIONS.map((x, i) => (
              <button
                key={x.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                aria-selected={i === idx}
                className={`comp-tab${i === idx ? ' active' : ''}`}
                onClick={() => setIdx(i)}
              >
                <span className="comp-logo"><Icon name={x.icon} size={15} strokeWidth={2} /></span>
                {x.name}
              </button>
            ))}
          </div>
          <div className="comp-body">
            <button className="comp-playpause" aria-label={playing ? 'Pause autoplay' : 'Play autoplay'} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause /> : <Play />}
            </button>
            <div className="comp-quote-row" key={o.key}>
              <div className="comp-quote">
                <blockquote>
                  “
                  {words.map((w, i) => (
                    <span className="comp-word" key={i} style={{ animationDelay: `${i * 28}ms` }}>
                      {w}
                      {i < words.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                  ”
                </blockquote>
                <div className="cite comp-fade">
                  Sample note, <b>{o.amount} of {TICKER_NAME[o.ticker]}</b>
                </div>
                <div className="comp-tags comp-fade">
                  {o.tags.map((t) => (
                    <span className="comp-tag" key={t}>{t}</span>
                  ))}
                </div>
                <div className="comp-links comp-fade">
                  <a className="comp-soc is-web" href="#occasions" aria-label={`Open the ${o.name.toLowerCase()} sample link`}>
                    <Globe />
                  </a>
                  <a className="comp-soc" href={SOCIALS[0].href} target="_blank" rel="noopener noreferrer" aria-label="Equigift on X">
                    <SocialIcon name="x" />
                  </a>
                </div>
              </div>
              <div className={`comp-bigmark comp-fade comp-bigmark--${o.ticker.toLowerCase()}`}>
                <BrandLogo name={TICKER_LOGO[o.ticker]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
