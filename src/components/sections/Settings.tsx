import { useState } from 'react';
import DeleteAccountModal from '../DeleteAccountModal';

interface Props {
  userEmail?: string;
  onSignOut?: () => void;
  onDeleteAccount?: (password: string) => Promise<{ error: string | null }>;
  isLocalMode?: boolean;
}

export default function Settings({ userEmail, onSignOut, onDeleteAccount, isLocalMode }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!onSignOut) return;
    setSigningOut(true);
    await onSignOut();
    setSigningOut(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚙️ Ustawienia</h2>
        <p className="text-gray-500 text-sm mt-1">Zarządzaj swoim kontem i aplikacją</p>
      </div>

      {/* Konto */}
      {!isLocalMode && userEmail && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Konto</h3>
          </div>
          <div className="p-6 space-y-4">

            {/* Info o koncie */}
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

            {/* Wyloguj */}
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
          </div>
        </div>
      )}

      {/* Tryb lokalny info */}
      {isLocalMode && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Konto</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                💾
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tryb lokalny</p>
                <p className="text-xs text-gray-500 mt-0.5">Dane zapisywane lokalnie w przeglądarce. Skonfiguruj Supabase aby korzystać z synchronizacji i kont.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informacje o aplikacji */}
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
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <span className="text-sm text-gray-600">Sekcje</span>
            <span className="text-sm font-medium text-gray-900">Budżet, Zadania, Zakupy, Posiłki, Pojazdy, Zwierzęta, Członkowie</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <span className="text-sm text-gray-600">Tryb</span>
            <span className={`text-sm font-medium ${isLocalMode ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isLocalMode ? '💾 Lokalny' : '☁️ Supabase'}
            </span>
          </div>
        </div>
      </div>

      {/* Strefa niebezpieczna — tylko Supabase */}
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

      {/* Modal usunięcia konta */}
      {showDeleteModal && userEmail && onDeleteAccount && (
        <DeleteAccountModal
          userEmail={userEmail}
          onConfirm={onDeleteAccount}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
