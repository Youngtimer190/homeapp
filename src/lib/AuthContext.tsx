import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

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

async function ensureFamilyRecord(userId: string) {
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
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureFamilyRecord(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        await ensureFamilyRecord(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

    // Krok 1: Weryfikacja hasła
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (signInError) return { error: 'Nieprawidłowe hasło. Spróbuj ponownie.' };

    // Krok 2: Pobierz aktualny token sesji
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: 'Brak aktywnej sesji.' };

    // Krok 3: Usuń dane z wszystkich tabel przez RPC
    await supabase.rpc('delete_user_data');

    // Krok 4: Usuń konto przez Edge Function (wymaga service_role)
    const { error: fnError } = await supabase.functions.invoke('delete-user', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (fnError) {
      // Fallback — wyloguj użytkownika nawet jeśli usunięcie konta nie powiodło się
      await supabase.auth.signOut();
      return { error: 'Dane zostały usunięte, ale konto nie mogło zostać całkowicie usunięte. Skontaktuj się z administratorem.' };
    }

    // Krok 5: Wyloguj
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
