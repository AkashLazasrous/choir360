import React, { useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ProductSubnavLink {
  id: string;
  label: string;
}

interface ProductSubnavProps {
  title: string;
  links: ProductSubnavLink[];
  ctaLabel: string;
  onCta: () => void;
  onNavigateSection?: (id: string) => void;
}

/**
 * Sticky local product nav — Apple iPhone-page model:
 * product title | section anchors | compact pill CTA.
 * On narrow widths, section links collapse into a “Sections” sheet.
 */
export const ProductSubnav: React.FC<ProductSubnavProps> = ({
  title,
  links,
  ctaLabel,
  onCta,
  onNavigateSection,
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const scrollTo = (id: string) => {
    onNavigateSection?.(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <nav className="product-subnav font-apple" aria-label="Product sections">
      <div className="product-subnav-inner">
        <span className="product-subnav-title">{title}</span>

        <details ref={detailsRef} className="product-subnav-sections md:hidden">
          <summary>
            Sections <ChevronDown className="ml-1 inline h-3.5 w-3.5 opacity-60" />
          </summary>
          <div className="product-subnav-sections-menu">
            {links.map((link) => (
              <button key={link.id} type="button" onClick={() => scrollTo(link.id)}>
                {link.label}
              </button>
            ))}
          </div>
        </details>

        <div className="product-subnav-links">
          {links.map((link) => (
            <button key={link.id} type="button" onClick={() => scrollTo(link.id)}>
              {link.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-pill btn-pill-primary" onClick={onCta}>
          {ctaLabel}
        </button>
      </div>
    </nav>
  );
};
