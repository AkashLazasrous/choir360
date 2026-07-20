import React from 'react';
import type { MetricCard } from './types';

type MetricCarouselProps = {
  metrics: MetricCard[];
  onSelect?: (id: string) => void;
};

/**
 * Aurex-style metric carousel — white cards, soft shadow, dark ink.
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
        className="md-metric-card snap-center shrink-0 rounded-[1.5rem] border border-black/[0.06] bg-white p-4 text-left text-[#121212] shadow-[0_10px_30px_rgba(18,18,18,0.08)]"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8a8a8a]">
          {m.label}
        </p>
        <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#121212]">
          {m.value}
        </p>
        <p className="mt-2 text-[12px] leading-snug text-[#5c5c5c]">{m.sub}</p>
        {typeof m.progress === 'number' && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[#121212]"
              style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }}
            />
          </div>
        )}
      </button>
    ))}
  </div>
);
