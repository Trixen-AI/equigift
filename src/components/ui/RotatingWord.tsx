import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/hooks/useInView';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Cycles through words every 2.6s: blur up and out (340ms), blur up and in (440ms). */
export function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');

  useEffect(() => {
    const reduce = prefersReducedMotion();
    let idx = 0;
    const id = window.setInterval(() => {
      idx = (idx + 1) % words.length;
      const el = ref.current;
      if (!el || reduce) {
        setI(idx);
        return;
      }
      const out = el.animate(
        [
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
          { opacity: 0, transform: 'translateY(-0.5em)', filter: 'blur(6px)' },
        ],
        { duration: 340, easing: EASE, fill: 'forwards' },
      );
      out.onfinish = () => {
        setI(idx);
        el.animate(
          [
            { opacity: 0, transform: 'translateY(0.5em)', filter: 'blur(6px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
          ],
          { duration: 440, easing: EASE },
        );
        out.cancel();
      };
    }, 2600);
    return () => window.clearInterval(id);
  }, [words]);

  return (
    <span className="rotw" data-longest={longest}>
      <span className="rotw-w" ref={ref}>{words[i]}</span>
    </span>
  );
}
