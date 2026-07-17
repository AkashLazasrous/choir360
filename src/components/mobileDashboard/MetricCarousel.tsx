import React from 'react';
import type { MetricCard } from './types';

type MetricCarouselProps = {
  metrics: MetricCard[];
  onSelect?: (id: string) => void;
};

const ACCENT: Record<MetricCard['accent'], string> = {
  teal: 'from-[#0e3d4c] to-[#134556]',
  gold: 'from-[#8a6a10] to-[#5c4a12]',
  mint: 'from-[#0f766e] to-[#042f2e]',
  rose: 'from-[#134556] to-[#050a14]',
};

/**
 * Pattern 2 — Segmented horizontal swiping cards with snap scroll.
 */
export const MetricCarousel: React.FC<MetricCarouselProps> = ({
  metrics,
  onSelect,
}) => (
  <div
    className="md-metric-carousel -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
    role="list"
    aria-label="Primary metrics"
  >
    {metrics.map((m) => (
      <button
        key={m.id}
        type="button"
        role="listitem"
        onClick={() => onSelect?.(m.id)}
        className={`md-metric-card snap-center shrink-0 rounded-[1.25rem] bg-gradient-to-br ${ACCENT[m.accent]} p-4 text-left text-[#f5f5f7] shadow-[0_8px_28px_rgba(0,0,0,0.35)]`}
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">
          {m.label}
        </p>
        <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-amber-200">
          {m.value}
        </p>
        <p className="mt-2 text-[12px] leading-snug text-white/65">{m.sub}</p>
        {typeof m.progress === 'number' && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-300 to-amber-300"
              style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }}
            />
          </div>
        )}
      </button>
    ))}
  </div>
);
