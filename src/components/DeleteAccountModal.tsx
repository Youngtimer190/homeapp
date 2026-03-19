import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';

interface Props {
  userEmail: string;
  onConfirm: (password: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export default function DeleteAccountModal({ userEmail, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lock body scroll
  useScrollLock(true);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const CONFIRM_PHRASE = 'USUŃ KONTO';

  const handleDelete = async () => {
    if (confirmation !== CONFIRM_PHRASE) {
      setError(`Wpisz dokładnie: ${CONFIRM_PHRASE}`);
      return;
    }
    if (!password) {
      setError('Wpisz hasło aby potwierdzić.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await onConfirm(password);
    if (err) {
      setError(err);
      setLoading(false);
    }
  };

  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Usuń konto</h2>
              <p className="text-red-100 text-sm">Ta operacja jest nieodwracalna</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 200px)', WebkitOverflowScrolling: 'touch' as any }}>
          {step === 1 && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <p className="text-red-800 font-semibold text-sm mb-2">⚠️ Uwaga! Zostaną usunięte:</p>
                <ul className="text-red-700 text-sm space-y-1 ml-4">
                  <li>• Wszystkie transakcje i budżet</li>
                  <li>• Wszystkie zadania</li>
                  <li>• Lista zakupów i posiłki</li>
                  <li>• Dane pojazdów i zwierząt</li>
                  <li>• Profile członków rodziny</li>
                  <li>• Konto użytkownika ({userEmail})</li>
                </ul>
                <p className="text-red-800 font-bold text-sm mt-2">Tych danych nie można odzyskać.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  Rozumiem, kontynuuj
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-gray-600 text-sm mb-5">
                Aby potwierdzić usunięcie konta, wpisz poniżej <strong className="text-gray-900">hasło</strong> oraz frazę potwierdzającą.
              </p>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 ml-1">Hasło do konta</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Wpisz swoje hasło"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1 ml-1">
                  Wpisz <strong className="text-red-600 font-mono">{CONFIRM_PHRASE}</strong> aby potwierdzić
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={e => { setConfirmation(e.target.value); setError(''); }}
                  placeholder={CONFIRM_PHRASE}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent font-mono"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setPassword(''); setConfirmation(''); setError(''); }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Wstecz
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || confirmation !== CONFIRM_PHRASE || !password}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Usuwanie...
                    </>
                  ) : (
                    <>🗑️ Usuń konto na zawsze</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
}
