import { useEffect, useRef, type CSSProperties } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Rich } from '@/components/ui/Rich';
import { RibbonScene } from '@/components/scenes/RibbonScene';
import { APP_URL, CTA } from '@/data/site';

// floating glass tiles: icon, tilt and position (fractions of the panel)
const TILES: { icon: string; rot: number; pos: CSSProperties; dashed?: boolean }[] = [
  { icon: 'gift', rot: -12, pos: { top: '16%', left: '7%' } },
  { icon: 'link', rot: 8, pos: { top: '30%', left: '4%' }, dashed: true },
  { icon: 'qr', rot: -9, pos: { top: '7%', left: '19%' } },
  { icon: 'trend', rot: 13, pos: { top: '15%', right: '8%' } },
  { icon: 'at', rot: -7, pos: { top: '30%', right: '4%' }, dashed: true },
  { icon: 'party', rot: 10, pos: { top: '8%', right: '19%' } },
];

function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const spot = ref.current;
    const host = spot?.parentElement;
    if (!spot || !host) return;
    let tx = 50;
    let ty = 42;
    let x = 50;
    let y = 42;
    let raf = 0;
    const step = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      spot.style.setProperty('--mx', `${x.toFixed(2)}%`);
      spot.style.setProperty('--my', `${y.toFixed(2)}%`);
      raf = Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(step);
    };
    host.addEventListener('pointermove', onMove);
    return () => {
      host.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

export function Cta() {
  const spotRef = useSpotlight();
  const strip = [...CTA.strip, ...CTA.strip];
  return (
    <section className="cta" id="send">
      <div className="wrap">
        <div className="panel panel--accent cta-panel">
          <div className="panel__dots" />
          <div className="cta-grid" />
          <div className="cta-spot" ref={spotRef} />
          <div className="cta-tiles" aria-hidden="true">
            {TILES.map((t, i) => (
              <div key={i} className={`cta-tile${t.dashed ? ' dashed' : ''}`} style={{ ...t.pos, ['--rot' as string]: `${t.rot}deg` }}>
                <Icon name={t.icon} size={26} />
              </div>
            ))}
          </div>
          <div className="panel__glow" />
          <div className="panel__inner">
            <h2>{CTA.title}</h2>
            <p className="sub">{CTA.body}</p>
            <div className="cta-cats">
              <div className="cta-catbox">
                <div className="cta-cat-label">{CTA.send.label}</div>
                <h3>{CTA.send.title}</h3>
                <p><Rich parts={CTA.send.body} /></p>
                <div className="cta-btns">
                  <a className="btn btn-pri" href={APP_URL}>{CTA.send.app}</a>
                  <a className="btn btn-glass" href="/app/send">{CTA.send.a}</a>
                  <a className="btn btn-glass" href="/app/gifts">{CTA.send.b}</a>
                </div>
              </div>
              <div className="cta-catbox cta-catbox--light">
                <div className="cta-cat-label">{CTA.claim.label}</div>
                <h3>{CTA.claim.title}</h3>
                <p>{CTA.claim.body}</p>
                <div className="cta-btns">
                  <a className="btn btn-white" href="/app/claim">{CTA.claim.a}</a>
                  <a className="btn btn-glass" href="#faq">{CTA.claim.b}</a>
                </div>
              </div>
              <div className="cta-catbox cta-catbox--dark">
                <RibbonScene variant="card" pixel={3} className="cta-bt-video" />
                <div className="cta-cat-label">{CTA.pools.label}</div>
                <h3><span className="bt-name">{CTA.pools.title}</span><sup className="tm">™</sup></h3>
                <p>{CTA.pools.body}</p>
                <div className="cta-btns">
                  <a className="btn btn-pri" href={APP_URL}>{CTA.pools.a}</a>
                </div>
              </div>
            </div>
          </div>
          <div className="cta-strip" aria-hidden="true">
            <div className="cta-strip-track">
              {strip.map((f, i) => (
                <div className="cta-feat" key={i}>
                  <Icon name={f.icon} size={18} />
                  {f.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
