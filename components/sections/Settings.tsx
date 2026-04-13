import { useState } from 'react';
import DeleteAccountModal from '../DeleteAccountModal';
import { useAuth } from '../../lib/AuthContext';

interface Props {
  userEmail?: string;
  onSignOut?: () => void;
  onDeleteAccount?: (password: string) => Promise<{ error: string | null }>;
  isLocalMode?: boolean;
}

export default function Settings({ userEmail, onSignOut, onDeleteAccount, isLocalMode }: Props) {
  const { updateEmail } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleSignOut = async () => {
    if (!onSignOut) return;
    setSigningOut(true);
    await onSignOut();
    setSigningOut(false);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!newEmail.trim()) { setEmailError('Podaj nowy adres e-mail.'); return; }
    if (newEmail.trim() === userEmail) { setEmailError('Nowy adres jest taki sam jak obecny.'); return; }
    setEmailLoading(true);
    const { error } = await updateEmail(newEmail.trim());
    setEmailLoading(false);
    if (error) setEmailError(error);
    else setEmailSuccess(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setNewEmail('');
    setEmailError('');
    setEmailSuccess(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚙️ Ustawienia</h2>
        <p className="text-gray-500 text-sm mt-1">Zarządzaj swoim kontem i aplikacją</p>
      </div>

      {!isLocalMode && userEmail && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Konto</h3>
          </div>
          <div className="p-6 space-y-4">

            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl text-white font-bold flex-shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
                <p className="text-xs text-gray-500 mt-0.5">Zalogowany · Konto rodzinne</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktywne
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
              <div>
                <p className="text-sm font-medium text-gray-900">Wyloguj się</p>
                <p className="text-xs text-gray-500 mt-0.5">Zakończ bieżącą sesję</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {signingOut ? '⏳' : '🚪'} {signingOut ? 'Wylogowywanie...' : 'Wyloguj'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
              <div>
                <p className="text-sm font-medium text-gray-900">Zmiana adresu e-mail</p>
                <p className="text-xs text-gray-500 mt-0.5">Obecny: {userEmail}</p>
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
              >
                📧 Zmień adres e-mail
              </button>
            </div>

          </div>
        </div>
      )}

      {isLocalMode && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Konto</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">💾</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tryb lokalny</p>
                <p className="text-xs text-gray-500 mt-0.5">Dane zapisywane lokalnie w przeglądarce. Skonfiguruj Supabase aby korzystać z synchronizacji i kont.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">O aplikacji</h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Nazwa aplikacji</span>
            <span className="text-sm font-medium text-gray-900">Dom Manager</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <span className="text-sm text-gray-600">Wersja</span>
            <span className="text-sm font-medium text-gray-900">1.0.0</span>
          </div>
        </div>
      </div>

      {!isLocalMode && onDeleteAccount && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50">
            <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide">⚠️ Strefa niebezpieczna</h3>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Usuń konto</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Trwale usuwa Twoje konto wraz ze wszystkimi danymi rodziny —
                  transakcjami, zadaniami, posiłkami, pojazdami, zwierzętami i członkami.
                  <br />
                  <span className="font-semibold text-red-600">Ta operacja jest nieodwracalna.</span>
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-xl text-sm font-semibold transition"
              >
                🗑️ Usuń konto
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && userEmail && onDeleteAccount && (
        <DeleteAccountModal
          userEmail={userEmail}
          onConfirm={onDeleteAccount}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">📧 Zmiana adresu e-mail</h3>
              <button onClick={closeEmailModal} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">✕</button>
            </div>
            <div className="p-6">
              {emailSuccess ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-3xl">✅</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Link potwierdzający wysłany!</p>
                    <p className="text-xs text-gray-500 mt-1">Sprawdź nową skrzynkę e-mail i kliknij link, aby potwierdzić zmianę adresu.</p>
                  </div>
                  <button onClick={closeEmailModal} className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-semibold transition">
                    Zamknij
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nowy adres e-mail</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                      placeholder="nowy@email.pl"
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                      <span className="text-red-500 flex-shrink-0">⚠️</span>
                      <p className="text-xs text-red-600">{emailError}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button type="button" onClick={closeEmailModal} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                      Anuluj
                    </button>
                    <button type="submit" disabled={emailLoading} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                      {emailLoading ? '⏳ Wysyłanie...' : 'Wyślij link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
