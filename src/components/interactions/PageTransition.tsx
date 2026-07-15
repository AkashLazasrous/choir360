import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface PageTransitionProps {
  /** Unique key per route/tab — remounts the enter animation. */
  pageKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Soft fade + rise when the active tab changes. Skips motion under
 * prefers-reduced-motion so content swaps instantly.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ pageKey, children, className }) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
