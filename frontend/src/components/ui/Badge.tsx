import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'draft'
  | 'progress';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  dot = false,
}) => {
  // UX4G Tag mapping for status labels: pattern ux4g-tag-{variant}-{color}
  let tagClass = 'ux4g-tag-tonal-neutral';
  let dotBadgeClass = 'ux4g-badge-dot-neutral';

  switch (variant) {
    case 'success':
      tagClass = 'ux4g-tag-filled-success';
      dotBadgeClass = 'ux4g-badge-dot-success';
      break;
    case 'warning':
      tagClass = 'ux4g-tag-filled-warning';
      dotBadgeClass = 'ux4g-badge-dot-warning';
      break;
    case 'error':
      tagClass = 'ux4g-tag-filled-error';
      dotBadgeClass = 'ux4g-badge-dot-danger';
      break;
    case 'info':
      tagClass = 'ux4g-tag-filled-info';
      dotBadgeClass = 'ux4g-badge-dot-info';
      break;
    case 'progress':
      tagClass = 'ux4g-tag-tonal-brand';
      dotBadgeClass = 'ux4g-badge-dot-primary';
      break;
    case 'draft':
      tagClass = 'ux4g-tag-tonal-neutral';
      dotBadgeClass = 'ux4g-badge-dot-neutral';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${tagClass} ux4g-tag-s ${className}`.trim()}
    >
      {dot && <span className={`${dotBadgeClass} mr-1`} aria-hidden="true" />}
      {children}
    </span>
  );
};

