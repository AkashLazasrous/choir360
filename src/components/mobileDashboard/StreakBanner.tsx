import React from 'react';
import { Flame } from 'lucide-react';

type StreakBannerProps = {
  days: number;
  label?: string;
  onClick?: () => void;
};

/**
 * Aurex micro-banner — soft cream chip, black accent.
 */
export const StreakBanner: React.FC<StreakBannerProps> = ({
  days,
  label,
  onClick,
}) => {
  if (days <= 0) return null;

  const text = label ?? `${days} Day${days !== 1 ? 's' : ''} Active`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="md-streak-banner flex w-full items-center gap-3 rounded-[1.25rem] border border-black/[0.06] bg-white px-3.5 py-2.5 text-left shadow-[0_8px_24px_rgba(18,18,18,0.06)]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#efebe4] text-[#121212]"
        aria-hidden
      >
        <Flame className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold tracking-[-0.015em] text-[#121212]">
          {text}
        </p>
        <p className="text-[11px] text-[#5c5c5c]">
          Keep the liturgy streak alive — show up this week
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[#111111] px-2.5 py-1 text-[11px] font-semibold text-white">
        Streak
      </span>
    </button>
  );
};
