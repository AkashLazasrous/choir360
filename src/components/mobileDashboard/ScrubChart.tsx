import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChartPoint } from './types';

type ScrubChartProps = {
  points: ChartPoint[];
  unit?: string;
  title?: string;
  className?: string;
};

function hapticTick() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      navigator.vibrate(8);
    }
  } catch {
    /* no-op — iOS Safari / unsupported */
  }
}

/**
 * Pattern 4 — Scrubbable haptic chart; finger drag updates live readout.
 */
export const ScrubChart: React.FC<ScrubChartProps> = ({
  points,
  unit = '%',
  title = 'Attendance trend',
  className = '',
}) => {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, points.length - 1));
  const lastHaptic = useRef(-1);

  const safePoints = points.length > 0 ? points : [{ label: '—', value: 0 }];
  const clampedIndex = Math.min(index, safePoints.length - 1);
  const active = safePoints[clampedIndex];
  const maxVal = Math.max(1, ...safePoints.map((p) => p.value));

  useEffect(() => {
    setIndex(Math.max(0, safePoints.length - 1));
    lastHaptic.current = -1;
  }, [points]);

  const pickFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || safePoints.length === 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const next = Math.round(ratio * (safePoints.length - 1));
      setIndex((prev) => {
        if (next !== prev && next !== lastHaptic.current) {
          lastHaptic.current = next;
          hapticTick();
        }
        return next;
      });
    },
    [safePoints.length],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pickFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    pickFromClientX(e.clientX);
  };

  return (
    <figure className={`md-scrub-chart ${className}`}>
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <figcaption className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
            {title}
          </figcaption>
          <p className="mt-0.5 text-[22px] font-semibold tracking-[-0.03em] text-[#f5c24c]" aria-live="polite">
            {active.value}
            {unit}
            <span className="ml-2 text-[12px] font-medium text-[#a1a1a6]">{active.label}</span>
          </p>
        </div>
      </div>

      <div
        ref={trackRef}
        role="slider"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={safePoints.length - 1}
        aria-valuenow={clampedIndex}
        aria-valuetext={`${active.value}${unit} on ${active.label}`}
        tabIndex={0}
        className="relative h-28 touch-none select-none rounded-2xl bg-black/40 px-1 pt-3 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
          if (e.key === 'ArrowRight') setIndex((i) => Math.min(safePoints.length - 1, i + 1));
        }}
      >
        <span id={id} className="sr-only">
          {title} scrub chart
        </span>
        <svg className="h-full w-full" viewBox={`0 0 ${Math.max(safePoints.length - 1, 1) * 40} 100`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
            </linearGradient>
          </defs>
          {safePoints.length > 1 && (
            <>
              <path
                d={
                  `M 0 ${100 - (safePoints[0].value / maxVal) * 88} ` +
                  safePoints
                    .slice(1)
                    .map(
                      (p, i) =>
                        `L ${(i + 1) * 40} ${100 - (p.value / maxVal) * 88}`,
                    )
                    .join(' ') +
                  ` L ${(safePoints.length - 1) * 40} 100 L 0 100 Z`
                }
                fill={`url(#${id}-fill)`}
              />
              <polyline
                fill="none"
                stroke="#f5c24c"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={safePoints
                  .map((p, i) => `${i * 40},${100 - (p.value / maxVal) * 88}`)
                  .join(' ')}
              />
            </>
          )}
        </svg>

        {/* Scrub cursor */}
        <div
          className="pointer-events-none absolute top-2 bottom-1 w-px bg-amber-300/80"
          style={{
            left: `${safePoints.length <= 1 ? 50 : (clampedIndex / (safePoints.length - 1)) * 100}%`,
          }}
        >
          <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(245,194,76,0.8)]" />
        </div>
      </div>
    </figure>
  );
};
