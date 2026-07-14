import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  className?: string;
}

/**
 * Scroll-triggered reveal: fades in and rises 16px the first time the element
 * enters the viewport. Content is always in the DOM (SEO/reader safe) and the
 * effect is skipped entirely under prefers-reduced-motion.
 */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};
