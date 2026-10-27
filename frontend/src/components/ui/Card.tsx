import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
  variant?: 'solid' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
  variant = 'solid',
}) => {
  const cardVariant = variant === 'outline' ? 'ux4g-card-outline' : 'ux4g-card-solid';

  return (
    <div className={`ux4g-card ${cardVariant} bg-white rounded-lg border border-[#DFE6E2] shadow-xs overflow-hidden w-full text-left ${className}`.trim()}>
      {(title || subtitle || action) && (
        <div className={`p-4 border-b border-[#DFE6E2] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left w-full ${headerClassName}`.trim()}>
          <div className="text-left w-full">
            {title && (
              <div className="text-base font-bold text-neutral-900 tracking-tight text-left">
                {title}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-neutral-500 mt-0.5 text-left">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0 self-start sm:self-auto">{action}</div>}
        </div>
      )}
      <div className={`p-4 text-left ${bodyClassName}`.trim()}>{children}</div>
      {footer && (
        <div className={`p-3 bg-[#F5F7F6] border-t border-[#DFE6E2] text-left ${footerClassName}`.trim()}>{footer}</div>
      )}
    </div>
  );
};

