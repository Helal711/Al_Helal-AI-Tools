import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'bottom' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'bottom',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {position === 'bottom' ? (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] w-full rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 dark:border-slate-800">
            {title && (
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            <IconButton
              size="sm"
              ariaLabel="Close sheet"
              onClick={onClose}
              icon={<X className="h-4 w-4" />}
            />
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      ) : (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            {title && (
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            <IconButton
              size="sm"
              ariaLabel="Close panel"
              onClick={onClose}
              icon={<X className="h-4 w-4" />}
            />
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      )}
    </div>
  );
};
