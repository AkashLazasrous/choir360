import React, { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** Spotlight color (CSS color). */
  spotlightColor?: string;
}

/**
 * Soft mouse-follow radial highlight for marketing tiles.
 * Desktop + mouse only; no-op on touch and under prefers-reduced-motion.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(245, 194, 76, 0.14)',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [spot, setSpot] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  };

  const onLeave = () => setSpot((s) => ({ ...s, active: false }));

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative overflow-hidden ${className}`}
    >
      {!reduceMotion && spot.active && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(280px circle at ${spot.x}px ${spot.y}px, ${spotlightColor}, transparent 55%)`,
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};
