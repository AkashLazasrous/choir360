import React, { Children } from 'react';
import { Reveal } from './Reveal';

interface StaggerProps {
  children: React.ReactNode;
  /** Delay between children in seconds. */
  step?: number;
  className?: string;
}

/** Wraps each child in Reveal with a staggered delay. */
export const Stagger: React.FC<StaggerProps> = ({ children, step = 0.06, className }) => (
  <div className={className}>
    {Children.map(children, (child, i) => (
      <Reveal delay={i * step}>{child}</Reveal>
    ))}
  </div>
);
