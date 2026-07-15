import React from 'react';
import { MagneticButton } from './MagneticButton';

type Variant = 'primary' | 'gold' | 'ghost' | 'onDark' | 'link' | 'secondary';

interface AppleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  magnetic?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-pill btn-pill-primary',
  gold: 'btn-pill btn-pill-gold',
  ghost: 'btn-pill btn-pill-ghost',
  onDark: 'btn-pill btn-pill-on-dark',
  link: 'btn-pill btn-pill-link',
  secondary: 'btn-pill btn-pill-secondary',
};

/**
 * Apple-style pill / text-link CTA. Optional magnetic pull for hero primaries.
 */
export const AppleButton: React.FC<AppleButtonProps> = ({
  variant = 'primary',
  magnetic = false,
  className = '',
  children,
  ...props
}) => {
  const classes = `${VARIANT_CLASS[variant]} font-apple ${className}`.trim();

  if (magnetic && variant !== 'link') {
    return (
      <MagneticButton className={classes} {...(props as React.ComponentPropsWithoutRef<typeof MagneticButton>)}>
        {children}
      </MagneticButton>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
};
