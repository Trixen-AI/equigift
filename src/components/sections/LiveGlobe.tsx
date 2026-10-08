import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

const GiftGlobe = lazy(() => import('@/components/scenes/GiftGlobe').then((m) => ({ default: m.GiftGlobe })));
import { LIVE } from '@/data/site';

const fmt = (n: number) => n.toLocaleString('en-US');
const SEGS = 24;

// US regular session: 09:30 to 16:00 New York time (390 minutes)
function sessionState(now: Date) {
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const mins = ny.getHours() * 60 + ny.getMinutes() + ny.getSeconds() / 60;
  const open = 9 * 60 + 30;
  const close = 16 * 60;
  const weekday = ny.getDay() > 0 && ny.getDay() < 6;
  const isOpen = weekday && mins >= open && mins < close;
  // minutes until the next weekday 09:30 when closed
  let toOpen = 0;
  if (!isOpen) {
    let days = 0;
    let d = ny.getDay();
    if (mins >= open) {
      days = 1;
      d = (d + 1) % 7;
    }
    while (d === 0 || d === 6) {
      days += 1;
      d = (d + 1) % 7;
    }
    toOpen = days * 1440 + open - mins;
  }
  const progress = isOpen ? (mins - open) / (close - open) : 1 - Math.min(1, toOpen / 1050);
  const left = (isOpen ? close - mins : toOpen) * 60;
  const hh = String(Math.floor(left / 3600)).padStart(2, '0');
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const ss = String(Math.floor(left % 60)).padStart(2, '0');
  return { isOpen, progress, clock: `${hh}:${mm}:${ss}` };
}

export function LiveGlobe() {
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const nums = { hero: LIVE.heroNum, sent: LIVE.sent, claimed: LIVE.claimed };
  const [sess, setSess] = useState(() => sessionState(new Date()));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 600);
    const id = window.setInterval(() => {
      setSess(sessionState(new Date()));
    }, 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, []);

  // pin the flight card above the tracked pin with a dashed leader line
  const onAnchor = useCallback((p: { x: number; y: number; visible: boolean }) => {
    const card = cardRef.current;
    const line = lineRef.current;
    const dot = dotRef.current;
    if (!card || !line || !dot) return;
    const cx = Math.min(Math.max(p.x - 110, 180), (card.parentElement?.clientWidth ?? 1000) - 180);
    const cy = Math.max(p.y - 70, 150);
    card.style.left = `${cx}px`;
    card.style.top = `${cy}px`;
    line.setAttribute('x1', String(cx));
    line.setAttribute('y1', String(cy));
    line.setAttribute('x2', String(p.x));
    line.setAttribute('y2', String(p.y));
    dot.setAttribute('cx', String(p.x));
    dot.setAttribute('cy', String(p.y));
    const on = p.visible ? '1' : '0';
    card.classList.toggle('show', p.visible);
    line.style.opacity = on;
    dot.style.opacity = on;
  }, []);

  const lit = Math.round(sess.progress * SEGS);

  return (
    <section className="globe-sec" id="live">
      <div className="wrap">
        <div className="panel panel--accent globe-panel">
          <div className="globe-wrap">
            <Suspense fallback={null}>
              <GiftGlobe onAnchor={onAnchor} />
            </Suspense>
            <div className="globe-scrim" />
          </div>
          <svg className="flight-leader" aria-hidden="true">
            <line ref={lineRef} />
            <circle ref={dotRef} r="3" />
          </svg>
          <div className="flight-card" ref={cardRef}>
            <div className="mc-lbl"><i />{LIVE.flight.lbl}</div>
            <div className="mc-key">{LIVE.flight.key}</div>
          </div>
          <div className="panel__inner">
            <span className="ds-label gs-livelabel" style={{ opacity: ready ? 1 : 0 }}><i />{LIVE.label}</span>
            <h2 className="sr-only">{LIVE.title}</h2>
            <div className={`globe-stats${ready ? ' is-live' : ''}`}>
              <div className="gs-hero">
                <span className="gs-hero-num">${fmt(nums.hero)}</span>
                <span className="gs-hero-lbl">{LIVE.heroLbl}</span>
              </div>
            </div>
          </div>
          <a className={`gs-box${ready ? ' show' : ''}`} href="#live">
            <div className="gs-row">
              <div className="gs-stat"><span className="gs-num">{fmt(nums.sent)}</span><span className="gs-lbl">Gifts sent</span></div>
              <div className="gs-stat"><span className="gs-num">{fmt(nums.claimed)}</span><span className="gs-lbl">Claimed</span></div>
            </div>
            <div className="gs-epoch">
              <div className="gs-epoch-top"><span>{sess.isOpen ? LIVE.session : LIVE.sessionClosed}</span><b>{sess.clock}</b></div>
              <div className="gs-epoch-bar">
                {Array.from({ length: SEGS }, (_, i) => (
                  <span key={i} className={`gs-seg${i < lit ? ' on' : ''}`} />
                ))}
              </div>
            </div>
            <div className="gs-explore"><span>{LIVE.link}</span><span>›</span></div>
          </a>
        </div>
      </div>
    </section>
  );
}
