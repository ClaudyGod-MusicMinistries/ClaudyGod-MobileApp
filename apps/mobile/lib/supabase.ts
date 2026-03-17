import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { ENV } from '../services/config';

const supabaseUrl = ENV.supabaseUrl.trim();
const supabasePublishableKey = ENV.supabasePublishableKey.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase config missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to enable auth.',
  );
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in the root .env.development or .env.production file.',
    );
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://invalid.supabase.co',
  supabasePublishableKey || 'missing-publishable-key',
  {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
