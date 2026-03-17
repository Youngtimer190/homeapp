

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
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 flex items-center justify-center p-4" style={{ inset: 0 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog — centered on all devices */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4" style={{ 
        maxHeight: 'calc(100dvh - 2rem)',
        marginTop: 'env(safe-area-inset-top, 0px)',
        marginBottom: 'env(safe-area-inset-bottom, 0px)'
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
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition shadow"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
