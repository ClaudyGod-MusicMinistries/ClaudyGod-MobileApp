import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ENV } from '../services/config';
import { authSessionStorage } from './authSessionStorage';

const supabaseUrl = ENV.supabaseUrl.trim();
const supabasePublishableKey = ENV.supabasePublishableKey.trim();

const containsPlaceholder = (value: string): boolean =>
  /(?:^|[._/-])(your(?:_|-)?project|placeholder|example|validation|missing)(?:[._/-]|$)/i.test(value);

const isValidSupabaseUrl = (value: string): boolean => {
  if (!value || containsPlaceholder(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname);
  } catch {
    return false;
  }
};

const isValidPublishableKey = (value: string): boolean =>
  value.length >= 20 && !containsPlaceholder(value);

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) && isValidPublishableKey(supabasePublishableKey);

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error('This sign-in option is not available right now.');
  }
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://unconfigured.supabase.co',
  isSupabaseConfigured ? supabasePublishableKey : 'unconfigured-publishable-key',
  {
    auth: {
      storage: authSessionStorage,
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      flowType: 'pkce',
      // Web email confirmation and recovery links arrive with auth state in the URL.
      detectSessionInUrl: isSupabaseConfigured && Platform.OS === 'web',
      lock: isSupabaseConfigured && Platform.OS !== 'web' ? processLock : undefined,
    },
  },
);
