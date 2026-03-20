import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        .insert({ user_id: userId, name: 'Wpisz nazwę rodziny' });
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = getSessionFromStorage();
  const [session, setSession] = useState<Session | null>(initial.session);
  const [user, setUser] = useState<User | null>(initial.user);
  const [loading, setLoading] = useState(!initial.user && isSupabaseConfigured);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) ensureFamilyRecord(session.user.id);
      setLoading(false);
    }).catch(() => setLoading(false));

    const timeout = setTimeout(() => setLoading(false), 1500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'USER_UPDATED') {
        // Wymuś odświeżenie sesji żeby pobrać aktualny email
        const { data } = await supabase.auth.getSession();
        const freshSession = data.session;
        setSession(freshSession);
        setUser(freshSession?.user ?? null);
        setIsPasswordRecovery(false);
        if (freshSession?.user) ensureFamilyRecord(freshSession.user.id);
      } else {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        } else if (event === 'SIGNED_IN') {
          if (session?.user) ensureFamilyRecord(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
        }
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
      if (error.message.includes('already registered') || error.message.includes('already exists'))
        return { error: 'Konto z tym adresem e-mail już istnieje.', needsConfirmation: false };
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
      if (error.message.includes('Invalid login credentials')) return { error: 'Nieprawidłowy e-mail lub hasło.' };
      if (error.message.includes('Email not confirmed')) return { error: 'Potwierdź adres e-mail przed zalogowaniem.' };
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('over_email_send_rate_limit'))
        return { error: 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.' };
      return { error: error.message };
    }
    return { error: null };
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.message.includes('Password should be')) return { error: 'Hasło musi mieć co najmniej 6 znaków.' };
      return { error: error.message };
    }
    setIsPasswordRecovery(false);
    return { error: null };
  };

  const updateEmail = async (newEmail: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.' };
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists'))
        return { error: 'Ten adres e-mail jest już zajęty.' };
      if (error.message.includes('Unable to validate') || error.message.includes('invalid'))
        return { error: 'Nieprawidłowy adres e-mail.' };
      return { error: error.message };
    }
    return { error: null };
  };

  const deleteAccount = async (password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) return { error: 'Supabase nie jest skonfigurowany.' };
    if (!user) return { error: 'Brak zalogowanego użytkownika.' };
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password });
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
    <AuthContext.Provider value={{
      session, user, loading, isPasswordRecovery,
      signUp, signIn, signOut, deleteAccount, resetPassword, updatePassword, updateEmail,
      isOnline: isSupabaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
