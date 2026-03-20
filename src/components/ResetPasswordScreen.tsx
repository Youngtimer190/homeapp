import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function ResetPasswordScreen() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !passwordConfirm) { setError('Wypełnij oba pola.'); return; }
    if (password !== passwordConfirm) { setError('Hasła nie są identyczne.'); return; }
    if (password.length < 6) { setError('Hasło musi mieć co najmniej 6 znaków.'); return; }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) setError(error);
    else setSuccess(true);
  };

  if (success) {
    return (
      <div
        className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hasło zmienione!</h2>
          <p className="text-gray-500 mb-8">Twoje nowe hasło zostało zapisane. Możesz teraz korzystać z aplikacji.</p>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <p className="text-sm text-gray-500 mb-4">Zostałeś automatycznie zalogowany.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-700 transition shadow-md"
            >
              🏠 Przejdź do aplikacji
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col items-center"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="w-full max-w-md px-4 pt-10 pb-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dom Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Ustaw nowe hasło</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-indigo-50/50">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">Resetowanie hasła</p>
              <p className="text-xs text-gray-500">Podaj nowe hasło do swojego konta</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nowe hasło</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 znaków"
                autoComplete="new-password"
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Powtórz nowe hasło</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Powtórz hasło"
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                <span className="text-red-500 flex-shrink-0">⚠️</span>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Zapisywanie...
                </span>
              ) : (
                '🔒 Ustaw nowe hasło'
              )}
            </button>
          </form>

          <div className="px-6 pb-6">
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
            >
              Anuluj i wyloguj się
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
