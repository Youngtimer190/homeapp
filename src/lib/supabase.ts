import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  supabaseUrl !== '' &&
  supabaseUrl !== 'your_supabase_url' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'your_supabase_anon_key';

// Create client only if configured, otherwise create a dummy that won't crash
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');
