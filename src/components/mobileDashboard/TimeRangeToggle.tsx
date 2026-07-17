import React from 'react';
import type { TimeRange } from './types';

const RANGES: TimeRange[] = ['D', 'W', 'M', 'Y'];

type TimeRangeToggleProps = {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
  labels?: Partial<Record<TimeRange, string>>;
};

/**
 * Pattern 3 — Inline micro-tabs D / W / M / Y above charts / metric strips.
 */
export const TimeRangeToggle: React.FC<TimeRangeToggleProps> = ({
  value,
  onChange,
  className = '',
  labels,
}) => (
  <div
    role="tablist"
    aria-label="Time range"
    className={`md-range-toggle inline-flex items-center gap-0.5 rounded-full bg-black/[0.06] p-0.5 ${className}`}
  >
    {RANGES.map((r) => {
      const selected = value === r;
      return (
        <button
          key={r}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(r)}
          className={
            'min-h-[32px] min-w-[36px] rounded-full px-2.5 text-[11px] font-semibold tracking-wide transition ' +
            (selected
              ? 'bg-[#0e3d4c] text-amber-200 shadow-sm'
              : 'text-[#64748b] active:text-[#0e3d4c]')
          }
        >
          {labels?.[r] ?? r}
        </button>
      );
    })}
  </div>
);
