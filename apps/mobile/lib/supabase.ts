import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ENV } from '../services/config';
import { authSessionStorage } from './authSessionStorage';

// Custom in-process lock that queues auth operations sequentially without arbitrary
// 0ms/10000ms timeout rejections or stuck navigator lock errors in web and mobile runtimes.
let authLockQueue: Promise<unknown> = Promise.resolve();

const resilientProcessLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> => {
  const run = async (): Promise<R> => {
    try {
      return await fn();
    } catch (error) {
      throw error;
    }
  };
  const next = authLockQueue.then(run, run);
  authLockQueue = next.catch(() => {});
  return next;
};

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
      // Use resilientProcessLock across all platforms (including web) to avoid both
      // Navigator LockManager browser lock issues and arbitrary acquire-timeout errors.
      lock: isSupabaseConfigured ? resilientProcessLock : undefined,
    },
  },
);
