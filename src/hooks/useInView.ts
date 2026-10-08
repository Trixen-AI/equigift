import { useEffect, useState, type RefObject } from 'react';

/** True while the element intersects the viewport (used to pause offscreen canvases). */
export function useInView(ref: RefObject<Element | null>, threshold = 0) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => setInView(es[0].isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return inView;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
