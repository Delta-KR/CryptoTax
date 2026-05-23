'use client';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg border border-line bg-card shadow-lg',
          size === 'sm' ? 'max-w-[400px]' : 'max-w-[480px]'
        )}
      >
        {title && (
          <div className="border-b border-line-2 px-6 py-4">
            <h2 id="modal-title" className="text-[16px] font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[13px] text-muted">{description}</p>
            )}
          </div>
        )}
        {children && <div className="px-6 py-5">{children}</div>}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line-2 bg-bg-soft px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
