import { createClient } from '@supabase/supabase-js';
import { ENV } from '../services/config';

const supabaseUrl = ENV.supabaseUrl || 'https://your-project.supabase.co';
const supabaseAnonKey = ENV.supabaseAnonKey || 'public-anon-key';

if (!ENV.supabaseAnonKey) {
  console.warn('Supabase anon key missing. Set EXPO_PUBLIC_SUPABASE_ANON_KEY to enable auth.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
