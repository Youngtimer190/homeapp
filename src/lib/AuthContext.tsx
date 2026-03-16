import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<{ error: string | null }>;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Odczyt sesji SYNCHRONICZNIE z localStorage — zero opóźnienia
function getSessionFromStorage(): { user: User | null; session: Session | null } {
  if (!isSupabaseConfigured) return { user: null, session: null };
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!authKey) return { user: null, session: null };
    const raw = localStorage.getItem(authKey);
    if (!raw) return { user: null, session: null };
    const parsed = JSON.parse(raw);
    const expiresAt = parsed?.expires_at;
    // Sprawdź czy token nie wygasł
    if (!expiresAt || expiresAt * 1000 < Date.now()) return { user: null, session: null };
    return {
      user: parsed?.user ?? null,
      session: parsed as Session ?? null,
    };
  } catch {
    return { user: null, session: null };
  }
}

async function ensureFamilyRecord(userId: string) {
  try {
    const { data } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      await supabase
        .from('families')
        .insert({ user_id: userId, family_name: 'Wpisz nazwę rodziny' });
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicjalizuj stan SYNCHRONICZNIE z localStorage — brak opóźnienia przy renderze
  const initial = getSessionFromStorage();
  const [session, setSession] = useState<Session | null>(initial.session);
  const [user, setUser] = useState<User | null>(initial.user);
  // Jeśli mamy sesję z localStorage — loading = false od razu
  const [loading, setLoading] = useState(!initial.user && isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Odśwież sesję w tle — bez blokowania UI
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureFamilyRecord(session.user.id); // w tle, bez await
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Timeout fallback — max 1.5s czekania
    const timeout = setTimeout(() => setLoading(false), 1500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        ensureFamilyRecord(session.user.id); // w tle
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.', needsConfirmation: false };

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return { error: 'Konto z tym adresem e-mail już istnieje.', needsConfirmation: false };
      }
      return { error: error.message, needsConfirmation: false };
    }

    if (data.session && data.user) {
      await ensureFamilyRecord(data.user.id);
      return { error: null, needsConfirmation: false };
    }

    return { error: null, needsConfirmation: true };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Nieprawidłowy e-mail lub hasło.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Potwierdź adres e-mail przed zalogowaniem.' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const deleteAccount = async (password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.' };
    if (!user) return { error: 'Brak zalogowanego użytkownika.' };

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (signInError) return { error: 'Nieprawidłowe hasło. Spróbuj ponownie.' };

    const { error: dataError } = await supabase.rpc('delete_user_data');
    if (dataError) console.error('Błąd usuwania danych:', dataError);

    if (supabaseAdmin) {
      const { error: adminError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (adminError) {
        console.error('Błąd usuwania konta przez admin:', adminError);
        await supabase.auth.signOut();
        return { error: 'Dane usunięte, ale konto nie mogło zostać usunięte.' };
      }
    } else {
      await supabase.auth.signOut();
      return { error: 'Brak klucza VITE_SUPABASE_SERVICE_ROLE_KEY w pliku .env.' };
    }

    await supabase.auth.signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, deleteAccount, isOnline: isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
