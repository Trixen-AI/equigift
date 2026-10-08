import { useEffect, useRef } from 'react';
import { useInView, prefersReducedMotion } from '@/hooks/useInView';

// Pixel-art gift ribbons: long satin bands that sweep across the frame and twist,
// so their light front and dark back faces alternate. Rendered at low resolution
// and upscaled with crisp pixels. Every frame is a pure function of time.

type Ribbon = {
  x0: number; y0: number; // start (fractions of width/height)
  dx: number; dy: number; // travel across the frame
  bend: number; bendF: number; // sideways sway
  width: number; // half width as a fraction of height
  twist: number; twistS: number; // twists along the length, twist speed
  speed: number; phase: number;
};

const LAYOUTS: Record<'panel' | 'card', Ribbon[]> = {
  panel: [
    { x0: 1.08, y0: 1.05, dx: -0.62, dy: -1.2, bend: 0.16, bendF: 2.2, width: 0.05, twist: 3.2, twistS: 0.35, speed: 0.22, phase: 0 },
    { x0: 0.98, y0: -0.05, dx: -0.3, dy: 1.15, bend: 0.12, bendF: 2.8, width: 0.042, twist: 4.1, twistS: -0.28, speed: 0.17, phase: 1.7 },
    { x0: 0.62, y0: 1.08, dx: 0.5, dy: -0.75, bend: 0.1, bendF: 3.4, width: 0.032, twist: 3.6, twistS: 0.42, speed: 0.26, phase: 3.1 },
    { x0: 1.1, y0: 0.42, dx: -0.42, dy: 0.2, bend: 0.2, bendF: 1.6, width: 0.07, twist: 2.4, twistS: -0.2, speed: 0.14, phase: 4.6 },
  ],
  card: [
    { x0: 1.05, y0: 1.1, dx: -0.5, dy: -1.25, bend: 0.14, bendF: 2.4, width: 0.07, twist: 2.8, twistS: 0.32, speed: 0.2, phase: 0.6 },
    { x0: 0.74, y0: 1.1, dx: 0.45, dy: -0.9, bend: 0.1, bendF: 3.1, width: 0.05, twist: 3.4, twistS: -0.36, speed: 0.24, phase: 2.4 },
    { x0: 1.1, y0: 0.2, dx: -0.36, dy: 0.5, bend: 0.12, bendF: 2, width: 0.06, twist: 2.2, twistS: 0.25, speed: 0.16, phase: 5 },
  ],
};

// front face: orange to warm white; back face: graphite greys (zats-derived palette)
const FRONT = [
  [249, 133, 0],
  [255, 182, 96],
  [255, 236, 212],
];
const BACK = [
  [18, 18, 19],
  [50, 50, 50],
  [96, 96, 96],
];
const mix = (ramp: number[][], t: number) => {
  const x = Math.min(0.999, Math.max(0, t)) * (ramp.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = ramp[i];
  const b = ramp[i + 1];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
};

export function RibbonScene({ variant = 'panel', pixel = 4, className }: { variant?: 'panel' | 'card'; pixel?: number; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(wrapRef);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ribbons = LAYOUTS[variant];
    let W = 0;
    let H = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(40, Math.round(r.width / pixel));
      H = Math.max(30, Math.round(r.height / pixel));
      canvas.width = W;
      canvas.height = H;
    };

    const draw = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, W, H);
      const STEPS = 140;
      for (const rb of ribbons) {
        let prev: { ax: number; ay: number; bx: number; by: number } | null = null;
        for (let i = 0; i <= STEPS; i++) {
          const s = i / STEPS;
          const sway = Math.sin(rb.bendF * s * Math.PI + t * rb.speed + rb.phase) * rb.bend;
          const cx = (rb.x0 + rb.dx * s + sway * 0.6) * W;
          const cy = (rb.y0 + rb.dy * s + sway * 0.25) * H;
          // tangent from the derivative of the path
          const dsw = Math.cos(rb.bendF * s * Math.PI + t * rb.speed + rb.phase) * rb.bend * rb.bendF * Math.PI;
          const tx = (rb.dx + dsw * 0.6) * W;
          const ty = (rb.dy + dsw * 0.25) * H;
          const tl = Math.hypot(tx, ty) || 1;
          const nx = -ty / tl;
          const ny = tx / tl;
          const tw = Math.cos(rb.twist * s * Math.PI * 2 + t * rb.twistS * Math.PI * 2 + rb.phase);
          const half = rb.width * H * tw;
          const a = { ax: cx - nx * half, ay: cy - ny * half, bx: cx + nx * half, by: cy + ny * half };
          if (prev) {
            const facing = tw >= 0;
            const light = Math.abs(tw);
            ctx.fillStyle = facing ? mix(FRONT, light * 0.9 + 0.1 * Math.sin(s * 9 + t)) : mix(BACK, light);
            ctx.beginPath();
            ctx.moveTo(prev.ax, prev.ay);
            ctx.lineTo(prev.bx, prev.by);
            ctx.lineTo(a.bx, a.by);
            ctx.lineTo(a.ax, a.ay);
            ctx.closePath();
            ctx.fill();
          }
          prev = a;
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
      draw(prefersReducedMotion() ? 4000 : performance.now());
      return () => ro.disconnect();
    }
    let raf = 0;
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant, pixel, inView]);

  return (
    <div ref={wrapRef} className={`ribbon-scene ${className ?? ''}`} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
