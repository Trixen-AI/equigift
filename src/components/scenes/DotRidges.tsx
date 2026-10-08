import { useEffect, useRef } from 'react';
import { useInView, prefersReducedMotion } from '@/hooks/useInView';

// A dot-matrix field of layered "market ridgelines": hills that trend upward to
// the right, lit by a slow sweep of light. Dots grow and brighten where a ridge
// is close to the light. Pure function of time; paused offscreen.

const COLS = 92;
const ROWS = 69;

// ridge heights (0 = bottom, 1 = top) for three layers, as functions of x in [0,1]
const ridges = [
  (x: number) => 0.3 + 0.28 * x + 0.06 * Math.sin(x * 9.1 + 0.4) + 0.035 * Math.sin(x * 23 + 1.3),
  (x: number) => 0.22 + 0.36 * x * x + 0.05 * Math.sin(x * 7.3 + 2.2) + 0.025 * Math.sin(x * 31 + 0.7),
  (x: number) => 0.12 + 0.2 * x + 0.04 * Math.sin(x * 12.7 + 4.1) + 0.02 * Math.sin(x * 41),
];
// layer colours: back (sky) to front (orange) on the near-black panel
const LAYER = ['188,239,255', '249,133,0', '255,198,128'];

export function DotRidges() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(wrapRef);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, W, H);
      // cover-fit the 92x69 grid into the box
      const cell = Math.max(W / COLS, H / ROWS);
      const ox = (W - cell * COLS) / 2;
      const oy = (H - cell * ROWS) / 2;
      const sweep = (Math.sin(t * 0.18) * 0.5 + 0.5) * 1.3 - 0.15; // light x position
      for (let c = 0; c < COLS; c++) {
        const x = c / (COLS - 1);
        const heights = ridges.map((f) => f(x));
        for (let r = 0; r < ROWS; r++) {
          const y = 1 - r / (ROWS - 1); // 1 at top
          // which layer (front-most first) covers this dot
          let layer = -1;
          let edge = 0;
          for (let k = ridges.length - 1; k >= 0; k--) {
            if (y <= heights[k]) {
              layer = k;
              edge = heights[k] - y;
            }
          }
          const lightD = Math.abs(x - sweep);
          const light = Math.exp(-(lightD * lightD) / 0.03);
          let size: number;
          let alpha: number;
          let rgb: string;
          if (layer === -1) {
            // sky: faint dots that brighten near the light
            size = 0.16 + 0.1 * light;
            alpha = 0.14 + 0.22 * light * (1 - y * 0.6);
            rgb = '255,255,255';
          } else {
            const ridgeGlow = Math.exp(-edge * 26); // bright just under each ridge line
            const shimmer = 0.5 + 0.5 * Math.sin(c * 0.55 - r * 0.4 + t * 1.2 + layer);
            size = 0.2 + 0.2 * ridgeGlow + 0.08 * light + 0.04 * shimmer;
            alpha = 0.32 + 0.5 * ridgeGlow + 0.25 * light;
            rgb = ridgeGlow > 0.6 ? '255,255,255' : LAYER[layer];
          }
          ctx.fillStyle = `rgba(${rgb},${Math.min(1, alpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(ox + (c + 0.5) * cell, oy + (r + 0.5) * cell, Math.min(0.48, size) * cell, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(wrap);
    if (prefersReducedMotion() || !inView) {
      draw(prefersReducedMotion() ? 9000 : performance.now());
      return () => ro.disconnect();
    }
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return; // ~30fps is plenty for a slow sweep
      last = now;
      draw(now);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [inView]);

  return (
    <div className="dot-matrix" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
