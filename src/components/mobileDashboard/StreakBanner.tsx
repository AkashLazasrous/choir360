import React from 'react';

type StreakBannerProps = {
  days: number;
  label?: string;
  onClick?: () => void;
};

/**
 * Pattern 8 — Streak & gamification micro-banner.
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
      className="md-streak-banner flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-lg"
        aria-hidden
      >
        🔥
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold tracking-[-0.015em] text-amber-200">
          {text}
        </p>
        <p className="text-[11px] text-teal-200/70">
          Keep the liturgy streak alive — show up this week
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
        Streak
      </span>
    </button>
  );
};
