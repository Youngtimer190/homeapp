import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface Props {
  onSuccess: () => void;
  onDemoMode: () => void;
}

export default function AuthScreen({ onSuccess, onDemoMode }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setNeedsConfirmation(false);
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
  };

  const translateError = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'Nieprawidłowy e-mail lub hasło.';
    if (msg.includes('Email not confirmed')) return 'Potwierdź adres e-mail przed zalogowaniem.';
    if (msg.includes('already registered') || msg.includes('User already registered')) return 'Konto z tym adresem e-mail już istnieje.';
    if (msg.includes('Password should be')) return 'Hasło musi mieć co najmniej 6 znaków.';
    if (msg.includes('Unable to validate')) return 'Nieprawidłowy adres e-mail.';
    if (msg.includes('Email rate limit') || msg.includes('over_email_send_rate_limit')) return 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.';
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);

    if (!email || !password) { setError('Wypełnij wszystkie pola.'); return; }
    if (mode === 'register') {
      if (password !== passwordConfirm) { setError('Hasła nie są identyczne.'); return; }
      if (password.length < 6) { setError('Hasło musi mieć co najmniej 6 znaków.'); return; }
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(translateError(error));
        setLoading(false);
      } else {
        // Logowanie udane — wywołaj onSuccess
        onSuccess();
      }
    } else {
      const { error, needsConfirmation: confirm } = await signUp(email, password);
      if (error) {
        setError(translateError(error));
        setLoading(false);
      } else if (confirm) {
        // Wymaga potwierdzenia e-mail
        setNeedsConfirmation(true);
        setLoading(false);
      } else {
        // Rejestracja udana i od razu zalogowany
        onSuccess();
      }
    }
  };

  // Ekran potwierdzenia e-maila
  if (needsConfirmation) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4 overflow-y-auto" style={{ minHeight: '100%' }}>
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg mb-6">
            <span className="text-4xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sprawdź swoją skrzynkę</h2>
          <p className="text-gray-500 mb-2">Wysłaliśmy link aktywacyjny na adres:</p>
          <p className="text-indigo-600 font-semibold text-lg mb-6">{email}</p>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6 text-left space-y-3">
            <p className="text-sm text-gray-600 font-semibold">Co dalej?</p>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p className="text-sm text-gray-600">Otwórz e-mail od Dom Manager</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p className="text-sm text-gray-600">Kliknij link „Potwierdź konto"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <p className="text-sm text-gray-600">Zostaniesz automatycznie zalogowany i zobaczysz swoją pustą przestrzeń rodzinną</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700">
            Nie widzisz e-maila? Sprawdź folder <strong>SPAM</strong> lub poczekaj kilka minut.
          </div>
          <button
            onClick={() => switchMode('login')}
            className="text-sm text-indigo-600 font-semibold hover:underline"
          >
            ← Wróć do logowania
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ minHeight: '100%', paddingTop: `calc(env(safe-area-inset-top) + 1rem)`, paddingBottom: `calc(env(safe-area-inset-bottom) + 1rem)` }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">🏠</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dom Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Zarządzaj swoim domem w jednym miejscu</p>
        </div>

        {isSupabaseConfigured ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === 'login'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔑 Logowanie
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === 'register'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✨ Rejestracja
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Info rejestracja */}
              {mode === 'register' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-indigo-700">🏠 Nowe konto = nowa rodzina</p>
                  <p className="text-xs text-indigo-600">
                    Każde zarejestrowane konto otrzymuje własną, w pełni prywatną przestrzeń dla rodziny. Twoje dane są synchronizowane między urządzeniami.
                  </p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adres e-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="twoj@email.pl"
                  autoComplete={mode === 'login' ? 'email' : 'new-email'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hasło</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 znaków"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>

              {/* Confirm password */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Powtórz hasło</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Powtórz hasło"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <span className="text-red-500 flex-shrink-0">⚠️</span>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-violet-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {mode === 'login' ? 'Logowanie...' : 'Rejestracja...'}
                  </span>
                ) : (
                  mode === 'login' ? '🔑 Zaloguj się' : '✨ Zarejestruj się'
                )}
              </button>
            </form>

            {/* Demo separator */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">lub</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button
                onClick={onDemoMode}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <span>💾</span>
                Wypróbuj bez konta (tryb demo)
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Dane zapisywane lokalnie w przeglądarce</p>
            </div>
          </div>
        ) : (
          /* Brak Supabase — tylko demo */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💾</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Tryb demonstracyjny</h2>
            <p className="text-sm text-gray-500 mb-6">
              Aplikacja działa lokalnie w przeglądarce. Aby włączyć synchronizację między urządzeniami i konta użytkowników, skonfiguruj Supabase.
            </p>
            <button
              onClick={onDemoMode}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-violet-700 transition shadow-md flex items-center justify-center gap-2"
            >
              <span>🚀</span> Uruchom aplikację w trybie demo
            </button>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[['💰','Budżet'],['✅','Zadania'],['🛒','Zakupy'],['🍽️','Posiłki'],['🚗','Pojazdy'],['🐾','Zwierzęta']].map(([icon, label]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
