import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  closeOnBackdropClick = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // UX4G Modal size mapping
  let modalSizeClass = 'ux4g-modal-m';
  if (maxWidth === 'sm') modalSizeClass = 'ux4g-modal-s';
  if (maxWidth === 'lg' || maxWidth === 'xl' || maxWidth === '2xl') modalSizeClass = 'ux4g-modal-l';

  return (
    <div
      className="ux4g-modal-backdrop ux4g-modal-backdrop-50 fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`ux4g-modal-box ${modalSizeClass} bg-white rounded-lg shadow-2xl border border-neutral-200 w-full overflow-hidden transform transition-all`}>
        {/* UX4G Modal Header */}
        <div className="ux4g-modal-header px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="pr-2">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight text-neutral-900 leading-snug">{title}</h2>
            {subtitle && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* UX4G Modal Body */}
        <div className="ux4g-modal-body px-3.5 sm:px-6 pt-3.5 sm:pt-5 pb-8 sm:pb-6 max-h-[86vh] sm:max-h-[80vh] overflow-y-auto">{children}</div>

        {/* UX4G Modal Footer */}
        {footer && (
          <div className="ux4g-modal-footer px-4 sm:px-6 py-3 sm:py-3.5 border-t border-neutral-200 flex flex-wrap items-center justify-end gap-2 sm:gap-3 bg-neutral-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

