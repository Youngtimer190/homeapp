import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // No longer blocking scroll on #root, using overscroll-behavior instead
  useEffect(() => {
    if (!isOpen) return;
    // Ensure modal is visible by scrolling to top
    const root = document.getElementById('root');
    if (root) {
      root.scrollTop = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Mobile layout: full screen modal */}
      <div 
        className="sm:hidden fixed inset-0 flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          ref={contentRef}
          className="relative bg-white w-full flex flex-col"
          style={{ height: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0 bg-white">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition"
            >
              ×
            </button>
          </div>
          {/* Scrollable body */}
          <div
            className="overflow-y-auto overscroll-contain flex-1"
            style={{
              WebkitOverflowScrolling: 'touch' as any,
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Desktop layout: centered modal */}
      <div className="hidden sm:flex absolute inset-0 items-center justify-center p-4">
        <div
          className={`relative bg-white w-full ${maxWidth} rounded-2xl shadow-2xl flex flex-col`}
          style={{ maxHeight: '90dvh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition"
            >
              ×
            </button>
          </div>
          {/* Scrollable body */}
          <div
            className="overflow-y-auto overscroll-contain flex-1"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
