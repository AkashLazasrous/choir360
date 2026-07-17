import React from 'react';

type ShimmerSkeletonProps = {
  /** Number of bento-style placeholder tiles */
  tiles?: number;
  className?: string;
};

/**
 * Pattern 10 — Animated shimmer placeholders for bento / metric cards.
 */
export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  tiles = 6,
  className = '',
}) => {
  const spans = ['md-bento-span-2x1', 'md-bento-span-1x1', 'md-bento-span-1x1', 'md-bento-span-2x1', 'md-bento-span-1x1', 'md-bento-span-2x1'];

  return (
    <div className={`space-y-4 ${className}`} aria-busy="true" aria-live="polite">
      <div className="md-shimmer h-10 w-full rounded-2xl" />
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="md-shimmer h-[7.5rem] w-[78%] shrink-0 rounded-[1.25rem]" />
        ))}
      </div>
      <div className="md-bento-grid">
        {Array.from({ length: tiles }).map((_, i) => (
          <div
            key={i}
            className={`md-shimmer rounded-[1.25rem] ${spans[i % spans.length]} min-h-[5.5rem]`}
          />
        ))}
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
};
