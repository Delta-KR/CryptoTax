'use client';
import { useEffect } from 'react';
import { Sidebar } from '@/components/app-chrome/Sidebar';
import type { User } from '@/lib/auth';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

export function MobileDrawer({ open, onClose, user }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      {/* Drawer panel */}
      <div className="absolute left-0 top-0 h-full w-[280px] shadow-lg">
        <Sidebar user={user} variant="drawer" onNavigate={onClose} />
      </div>
    </div>
  );
}
