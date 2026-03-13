import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../services/config';

const supabaseUrl = ENV.supabaseUrl || 'https://placeholder.supabase.co';
const supabasePublishableKey = ENV.supabasePublishableKey || 'public-anon-key';

export const isSupabaseConfigured = Boolean(ENV.supabaseUrl && ENV.supabasePublishableKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase config missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to enable auth.',
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
