import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured =
  supabaseUrl !== '' &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'your_supabase_anon_key';

// Klient publiczny (anon key) — do normalnych operacji
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,      // automatyczne odświeżanie tokena
        persistSession: true,        // zapisuj sesję w localStorage
        detectSessionInUrl: true,    // wykrywaj sesję z URL (reset hasła, email)
        storageKey: 'dom-manager-auth', // stały klucz — iOS nie zgubi sesji
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Klient administracyjny (service_role) — tylko do usuwania konta
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceRoleKey !== '' && supabaseServiceRoleKey !== 'your_supabase_service_role_key'
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
