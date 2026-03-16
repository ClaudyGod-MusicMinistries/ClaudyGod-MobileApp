import * as Linking from 'expo-linking';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { apiFetch } from './apiClient';

export interface MobileAuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
  emailVerifiedAt: string | null;
}

export interface MobileAuthResponse {
  accessToken: string;
  user: MobileAuthUser;
  requiresEmailVerification?: boolean;
}

export interface RegisterMobileUserInput {
  email: string;
  password: string;
  displayName: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface AuthActionResponse {
  message: string;
}

const APP_SIGN_IN_URL = Linking.createURL('/sign-in');

const normalizeRole = (value: unknown): 'CLIENT' | 'ADMIN' =>
  value === 'ADMIN' ? 'ADMIN' : 'CLIENT';

const inferDisplayName = (user: User): string => {
  const metadata = user.user_metadata ?? {};
  const candidate =
    metadata.display_name ??
    metadata.displayName ??
    metadata.full_name ??
    metadata.fullName;

  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  if (user.email && user.email.includes('@')) {
    return user.email.split('@')[0]!;
  }

  return 'ClaudyGod User';
};

const toMobileAuthUser = (user: User): MobileAuthUser => ({
  id: user.id,
  email: user.email ?? '',
  displayName: inferDisplayName(user),
  role: normalizeRole(user.user_metadata?.role),
  createdAt: user.created_at ?? new Date().toISOString(),
  emailVerifiedAt: user.email_confirmed_at ?? null,
});

const ensureSupabaseConfig = (): void => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in the root .env.development or .env.production file.',
    );
  }
};

const syncBackendSession = async (accessToken?: string): Promise<void> => {
  if (!accessToken) {
    return;
  }

  try {
    await apiFetch('/v1/me/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.warn('backend session sync skipped:', error);
  }
};

const requireAuthResponse = (
  user: User | null,
  accessToken: string | undefined,
  requiresEmailVerification = false,
): MobileAuthResponse => {
  if (!user) {
    throw new Error('Authentication did not return a user');
  }

  return {
    accessToken: accessToken ?? '',
    user: toMobileAuthUser(user),
    requiresEmailVerification,
  };
};

export async function loginMobileUser(input: {
  email: string;
  password: string;
}): Promise<MobileAuthResponse> {
  ensureSupabaseConfig();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncBackendSession(data.session?.access_token);
  return requireAuthResponse(data.user, data.session?.access_token);
}

export async function registerMobileUser(input: RegisterMobileUserInput): Promise<MobileAuthResponse> {
  ensureSupabaseConfig();

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: APP_SIGN_IN_URL,
      data: {
        display_name: input.displayName.trim(),
        full_name: input.displayName.trim(),
        role: 'CLIENT',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncBackendSession(data.session?.access_token);
  return requireAuthResponse(data.user, data.session?.access_token, !data.session);
}

export async function requestVerificationEmail(
  input: ForgotPasswordInput,
): Promise<AuthActionResponse> {
  ensureSupabaseConfig();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: input.email.trim().toLowerCase(),
    options: {
      emailRedirectTo: APP_SIGN_IN_URL,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    message: 'Verification email sent.',
  };
}

export async function verifyMobileEmail(input: VerifyEmailInput): Promise<MobileAuthResponse> {
  ensureSupabaseConfig();

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: input.token.trim(),
    type: 'signup',
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncBackendSession(data.session?.access_token);
  return requireAuthResponse(data.user, data.session?.access_token);
}

export async function requestMobilePasswordReset(
  input: ForgotPasswordInput,
): Promise<AuthActionResponse> {
  ensureSupabaseConfig();

  const { error } = await supabase.auth.resetPasswordForEmail(
    input.email.trim().toLowerCase(),
    {
      redirectTo: APP_SIGN_IN_URL,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    message: 'Password reset email sent.',
  };
}

export async function resetMobilePassword(
  input: ResetPasswordInput,
): Promise<AuthActionResponse> {
  ensureSupabaseConfig();

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: input.token.trim(),
    type: 'recovery',
  });

  if (verifyError) {
    throw new Error(verifyError.message);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    message: 'Password updated successfully.',
  };
}

export async function clearMobileSession(): Promise<void> {
  ensureSupabaseConfig();

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getStoredMobileSession(): Promise<{
  accessToken: string | null;
  user: MobileAuthUser | null;
}> {
  if (!isSupabaseConfigured) {
    return { accessToken: null, user: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    accessToken: session?.access_token ?? null,
    user: session?.user ? toMobileAuthUser(session.user) : null,
  };
}
