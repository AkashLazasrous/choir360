import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

interface CountUpProps {
  value: number;
  /** Formats the animated value; defaults to en-IN locale integer. */
  format?: (n: number) => string;
  durationS?: number;
}

/**
 * Animates a number from 0 to `value` the first time it scrolls into view.
 * Under prefers-reduced-motion the final value renders immediately.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  format = (n) => Math.round(n).toLocaleString('en-IN'),
  durationS = 0.9,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) { setDisplay(value); return; }
    if (!inView) return;
    const controls = animate(display, value, {
      duration: durationS,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
    // `display` is intentionally omitted: it is the animation output, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduceMotion, durationS]);

  return <span ref={ref}>{format(display)}</span>;
};
