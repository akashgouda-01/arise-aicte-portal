import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // UX4G Button Contract: base class first, then variant class, then size class
  const baseClass = 'ux4g-btn';
  
  let variantClass = 'ux4g-btn-primary';
  let spinnerVariant = 'ux4g-spinner-inverse-full';

  if (variant === 'secondary') {
    variantClass = 'ux4g-btn-secondary';
    spinnerVariant = 'ux4g-spinner-primary-full';
  } else if (variant === 'outline') {
    variantClass = 'ux4g-btn-outline-primary';
    spinnerVariant = 'ux4g-spinner-primary-full';
  } else if (variant === 'destructive') {
    variantClass = 'ux4g-btn-danger';
    spinnerVariant = 'ux4g-spinner-inverse-full';
  } else if (variant === 'ghost') {
    variantClass = 'ux4g-btn-text-primary';
    spinnerVariant = 'ux4g-spinner-primary-full';
  }

  let sizeClass = 'ux4g-btn-m ';
  if (size === 'sm') sizeClass = 'ux4g-btn-s ';
  if (size === 'lg') sizeClass = 'ux4g-btn-l ';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <span className={`${spinnerVariant} ux4g-spinner-xs mr-2`} role="status" aria-label="Loading" />
      ) : (
        icon && <span className="flex-shrink-0 mr-1.5">{icon}</span>
      )}
      {children}
    </button>
  );
};

