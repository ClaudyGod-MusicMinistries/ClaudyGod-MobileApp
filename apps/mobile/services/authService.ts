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

const normalizePath = (value: string): string => (value.startsWith('/') ? value : `/${value}`);

const getWebOrigin = (): string => {
  const location = (globalThis as { location?: { origin?: string } }).location;

  if (!location) {
    return '';
  }

  const origin = String(location.origin || '').trim().replace(/\/+$/, '');
  if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin)) {
    return '';
  }

  return origin;
};

const buildAuthRedirectUrl = (path: string): string => {
  const normalizedPath = normalizePath(path);
  const webOrigin = getWebOrigin();

  if (webOrigin) {
    return `${webOrigin}${normalizedPath}`;
  }

  return Linking.createURL(normalizedPath);
};

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
      emailRedirectTo: buildAuthRedirectUrl('/verify-email'),
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
      emailRedirectTo: buildAuthRedirectUrl('/verify-email'),
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

  const tokenHash = input.token.trim();
  let data;
  let error;

  if (tokenHash) {
    ({ data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'signup',
    }));
  } else {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    if (!session?.user?.email_confirmed_at) {
      throw new Error('Open the verification link from your email to finish confirming your account.');
    }

    data = {
      session,
      user: session.user,
    };
    error = null;
  }

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
      redirectTo: buildAuthRedirectUrl('/reset-password'),
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

  const tokenHash = input.token.trim();

  if (tokenHash) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });

    if (verifyError) {
      throw new Error(verifyError.message);
    }
  } else {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    if (!session) {
      throw new Error('Open the reset link from your email to continue, or paste the reset token hash.');
    }
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
