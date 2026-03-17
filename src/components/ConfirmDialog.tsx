

import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Usuń',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Block scrolling on #root when dialog is open
  useEffect(() => {
    const root = document.getElementById('root');
    const html = document.documentElement;
    const scrollingElement = document.scrollingElement || document.documentElement;
    if (!root) return;

    if (isOpen) {
      root.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      // Scroll to top to ensure dialog is visible
      root.scrollTop = 0;
      html.scrollTop = 0;
      scrollingElement.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      root.style.overflow = 'auto';
      html.style.overflow = 'auto';
    }

    return () => {
      root.style.overflow = 'auto';
      html.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-50 inset-0 flex items-center justify-center"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

       {/* Dialog — centered on all devices */}
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-sm p-6 flex flex-col items-center gap-4 overflow-y-auto overscroll-contain" style={{ 
        maxHeight: 'calc(100dvh - 2rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
       }}>
         {/* Icon */}
         <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
           🗑️
         </div>

         {/* Title */}
         <h2 className="text-xl font-bold text-gray-800 text-center">{title}</h2>

         {/* Message */}
         <p className="text-gray-500 text-center text-sm leading-relaxed">{message}</p>

            {/* Buttons */}
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition min-h-[44px]"
              >
                Anuluj
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition shadow min-h-[44px]"
              >
                {confirmLabel}
              </button>
            </div>
       </div>
    </div>
  );
}
