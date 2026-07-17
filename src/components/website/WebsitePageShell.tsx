import React, { useRef } from 'react';
import { useSectionReveals } from '../../features/website/motion/desktopMotion';

export type WebsitePageFilter = {
  id: string;
  label: string;
};

type WebsitePageShellProps = {
  eyebrow?: string;
  title: string;
  lede?: string;
  filters?: WebsitePageFilter[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  actions?: React.ReactNode;
  /** When false, skip GSAP reveals. Default true (hook still guards viewport/motion). */
  motion?: boolean;
  /** Hide editorial hero (page already has its own, e.g. Overview). */
  hideHero?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Desktop cinematic page frame — Unseen-language hero + optional filters.
 * Children render once; hero chrome is desktop-only via CSS.
 */
export const WebsitePageShell: React.FC<WebsitePageShellProps> = ({
  eyebrow = 'Choir360',
  title,
  lede,
  filters,
  activeFilter,
  onFilterChange,
  actions,
  motion = true,
  hideHero = false,
  children,
  className = '',
}) => {
  const rootRef = useRef<HTMLElement>(null);
  useSectionReveals(rootRef, motion);

  return (
    <section
      ref={rootRef}
      className={`website-page ${className}`.trim()}
    >
      {!hideHero && (
        <header className="website-page-hero" data-reveal>
          <p className="website-eyebrow">{eyebrow}</p>
          <h1 className="website-page-title" data-split="words">
            {title}
          </h1>
          {lede ? (
            <p className="website-page-lede" data-reveal>
              {lede}
            </p>
          ) : null}
          {(filters?.length || actions) && (
            <div className="website-page-toolbar" data-reveal>
              {filters && filters.length > 0 ? (
                <div className="website-filters" role="tablist" aria-label="Page filters">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === f.id}
                      className={
                        'website-filter' + (activeFilter === f.id ? ' is-active' : '')
                      }
                      onClick={() => onFilterChange?.(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span />
              )}
              {actions ? <div className="website-page-actions">{actions}</div> : null}
            </div>
          )}
        </header>
      )}
      <div className="website-page-body">{children}</div>
    </section>
  );
};
