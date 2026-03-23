import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ENV } from '../services/config';
import { authSessionStorage } from './authSessionStorage';

const supabaseUrl = ENV.supabaseUrl.trim();
const supabasePublishableKey = ENV.supabasePublishableKey.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error('This sign-in option is not available right now.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://invalid.supabase.co',
  supabasePublishableKey || 'missing-publishable-key',
  {
    auth: {
      storage: authSessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      // Web email confirmation and recovery links arrive with auth state in the URL.
      detectSessionInUrl: Platform.OS === 'web',
      lock: processLock,
    },
  },
);
