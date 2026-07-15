import React from 'react';

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
 */
export const ProductSubnav: React.FC<ProductSubnavProps> = ({
  title,
  links,
  ctaLabel,
  onCta,
  onNavigateSection,
}) => {
  const scrollTo = (id: string) => {
    onNavigateSection?.(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="product-subnav font-apple" aria-label="Product sections">
      <div className="product-subnav-inner">
        <span className="product-subnav-title">{title}</span>
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
