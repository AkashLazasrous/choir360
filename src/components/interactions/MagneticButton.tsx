import React, { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

const MAX_PULL_PX = 8;

type MagneticButtonProps = React.ComponentPropsWithoutRef<typeof motion.button> & {
  /** How strongly the button follows the cursor (0-1). */
  strength?: number;
};

/**
 * Primary-CTA button that leans up to 8px toward the cursor and springs back
 * on exit. Mouse-only (ignored on touch) and disabled under
 * prefers-reduced-motion. Use on at most one or two CTAs per view.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({ strength = 0.2, children, ...props }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 22 });
  const springY = useSpring(y, { stiffness: 320, damping: 22 });

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-MAX_PULL_PX, Math.min(MAX_PULL_PX, dx * strength)));
    y.set(Math.max(-MAX_PULL_PX, Math.min(MAX_PULL_PX, dy * strength)));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerUp={reset}
      {...props}
    >
      {children}
    </motion.button>
  );
};
