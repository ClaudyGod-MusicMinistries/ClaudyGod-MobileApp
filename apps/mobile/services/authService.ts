import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ApiError, apiFetch } from './apiClient';
import { authSessionStorage } from '../lib/authSessionStorage';
import { assertSupabaseConfigured, supabase } from '../lib/supabase';

let sessionDeviceFingerprint: string | null = null;

function getDeviceFingerprint(): string {
  if (!sessionDeviceFingerprint) {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    sessionDeviceFingerprint = `${Platform.OS}:${String(Platform.Version ?? 'unknown')}:${id}`;
  }
  return sessionDeviceFingerprint;
}

function registerDeviceFireAndForget(accessToken: string): void {
  const fingerprint = getDeviceFingerprint();
  apiFetch<unknown>('/v1/me/devices/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      deviceFingerprint: fingerprint,
      deviceType: Platform.OS === 'web' ? 'web' : 'mobile',
      platform: Platform.OS,
      appVersion: '1.0.0',
    }),
  }).catch(() => {
    // Fire-and-forget — device registration failure must never block auth.
  });
}

export interface MobileAuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
  emailVerifiedAt: string | null;
}

export interface MobileAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user: MobileAuthUser;
  requiresEmailVerification?: boolean;
  message?: string;
}

export interface RegisterMobileResponse {
  accessToken?: string;
  user?: MobileAuthUser;
  requiresEmailVerification: boolean;
  pendingEmail?: string;
  message: string;
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
  email?: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  code: string;
  email: string;
}

export interface AuthActionResponse {
  message: string;
}

interface StoredMobileSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: MobileAuthUser;
}

interface MobileSessionSnapshot {
  accessToken: string | null;
  user: MobileAuthUser | null;
}

interface ParsedStoredMobileSession extends MobileSessionSnapshot {
  refreshToken: string | null;
}

const MOBILE_AUTH_STORAGE_KEY = 'claudygod.mobile-auth-session.v1';
const authStateListeners = new Set<(_snapshot: MobileSessionSnapshot) => void>();
const usesBrowserCookieSession = Platform.OS === 'web';

const resolveOAuthRedirectUrl = (): string => {
  if (Platform.OS !== 'web') {
    return Linking.createURL('auth/callback');
  }

  const webLocation =
    typeof globalThis !== 'undefined' && 'location' in globalThis
      ? (globalThis as { location?: { origin?: string } }).location
      : undefined;

  return `${webLocation?.origin ?? ''}/auth/callback`;
};

const isMobileAuthUser = (value: unknown): value is MobileAuthUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.displayName === 'string' &&
    (candidate.role === 'CLIENT' || candidate.role === 'ADMIN') &&
    typeof candidate.createdAt === 'string' &&
    (typeof candidate.emailVerifiedAt === 'string' || candidate.emailVerifiedAt === null)
  );
};

const parseStoredMobileSession = (raw: string | null): ParsedStoredMobileSession => {
  if (!raw) {
    return { accessToken: null, refreshToken: null, user: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredMobileSession>;
    if (
      (parsed.accessToken !== null &&
        parsed.accessToken !== undefined &&
        typeof parsed.accessToken !== 'string') ||
      (parsed.refreshToken !== null &&
        parsed.refreshToken !== undefined &&
        typeof parsed.refreshToken !== 'string') ||
      !isMobileAuthUser(parsed.user)
    ) {
      return { accessToken: null, refreshToken: null, user: null };
    }

    return {
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : null,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
      user: parsed.user,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
};

const notifyAuthStateListeners = (snapshot: MobileSessionSnapshot): void => {
  authStateListeners.forEach((listener) => {
    listener(snapshot);
  });
};

const persistMobileSession = async (
  response: Pick<MobileAuthResponse, 'accessToken' | 'refreshToken' | 'user'>,
) => {
  const nextSession: StoredMobileSession = {
    accessToken: typeof response.accessToken === 'string' ? response.accessToken : null,
    refreshToken: typeof response.refreshToken === 'string' ? response.refreshToken : null,
    user: response.user,
  };

  await authSessionStorage.setItem(MOBILE_AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  notifyAuthStateListeners(nextSession);
  if (nextSession.accessToken) {
    registerDeviceFireAndForget(nextSession.accessToken);
  }
};

const createSessionSnapshot = (
  payload: MobileAuthResponse,
  requiresEmailVerification = false,
): MobileAuthResponse => ({
  accessToken: payload.accessToken,
  refreshToken: payload.refreshToken,
  user: payload.user,
  requiresEmailVerification,
  message: payload.message,
});

export const subscribeToMobileAuthStateChange = (
  listener: (_snapshot: MobileSessionSnapshot) => void,
): (() => void) => {
  authStateListeners.add(listener);
  return () => {
    authStateListeners.delete(listener);
  };
};

const fetchCurrentMobileUser = async (): Promise<MobileSessionSnapshot> => {
  const response = await apiFetch<{ authenticated: boolean; user: MobileAuthUser | null }>(
    '/v1/auth/session',
  );
  return {
    accessToken: null,
    user: response.authenticated ? response.user : null,
  };
};

async function fetchMobileUserWithBearerToken(accessToken: string): Promise<MobileAuthUser> {
  const response = await apiFetch<{ authenticated: boolean; user: MobileAuthUser | null }>(
    '/v1/auth/session',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.authenticated || !response.user) {
    throw new Error('Secure sign-in completed without a user session');
  }

  return response.user;
}

const readStoredMobileSessionRecord = async (): Promise<StoredMobileSession | null> => {
  const storedSession = await authSessionStorage.getItem(MOBILE_AUTH_STORAGE_KEY);
  const parsed = parseStoredMobileSession(storedSession);

  if (!storedSession || !parsed.user) {
    if (storedSession && !parsed.user) {
      await authSessionStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
    }
    return null;
  }

  try {
    const raw = JSON.parse(storedSession) as StoredMobileSession;
    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof raw.refreshToken === 'string' ? raw.refreshToken : null,
      user: parsed.user,
    };
  } catch {
    return {
      accessToken: parsed.accessToken,
      refreshToken: null,
      user: parsed.user,
    };
  }
};

async function refreshMobileSessionWithToken(refreshToken: string): Promise<MobileSessionSnapshot> {
  let response: MobileAuthResponse;
  try {
    response = await apiFetch<MobileAuthResponse>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    await authSessionStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
    notifyAuthStateListeners({ accessToken: null, user: null });
    throw error;
  }

  if (!response.user || !response.accessToken) {
    await authSessionStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
    notifyAuthStateListeners({ accessToken: null, user: null });
    throw new Error('Session refresh completed without a usable session');
  }

  await persistMobileSession(response);
  return {
    accessToken: response.accessToken ?? null,
    user: response.user,
  };
}

export async function restoreMobileSession(): Promise<MobileSessionSnapshot> {
  if (usesBrowserCookieSession) {
    try {
      const snapshot = await fetchCurrentMobileUser();
      await authSessionStorage.setItem(
        MOBILE_AUTH_STORAGE_KEY,
        JSON.stringify({
          accessToken: null,
          user: snapshot.user,
        }),
      );
      return snapshot;
    } catch {
      await authSessionStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
      return { accessToken: null, user: null };
    }
  }

  const storedSession = await readStoredMobileSessionRecord();
  if (!storedSession) {
    return { accessToken: null, user: null };
  }

  if (!storedSession.refreshToken) {
    return {
      accessToken: storedSession.accessToken,
      user: storedSession.user,
    };
  }

  try {
    return await refreshMobileSessionWithToken(storedSession.refreshToken);
  } catch {
    await authSessionStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
    return { accessToken: null, user: null };
  }
}

export async function loginMobileUser(input: {
  email: string;
  password: string;
}): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });

  if (!response.user) {
    throw new Error('Sign-in completed without a user session');
  }

  if (!usesBrowserCookieSession && !response.accessToken) {
    throw new Error('Sign-in completed without an access token');
  }

  await persistMobileSession(response);
  return createSessionSnapshot(response);
}

export async function loginMobileUserWithGoogle(): Promise<MobileAuthResponse> {
  assertSupabaseConfigured();

  const redirectTo = resolveOAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Google sign-in is not available right now.');
  }

  if (!data.url) {
    throw new Error('Google sign-in is not configured for this application.');
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (browserResult.type !== 'success' || !browserResult.url) {
    throw new Error('Google sign-in was cancelled.');
  }

  const parsed = new URL(browserResult.url.replace('#', '?'));
  const code = parsed.searchParams.get('code') ?? '';
  let accessToken = parsed.searchParams.get('access_token') ?? '';
  let refreshToken = parsed.searchParams.get('refresh_token') ?? '';

  if (code && (!accessToken || !refreshToken)) {
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw new Error(exchangeError.message || 'Unable to finish Google sign-in.');
    }
    accessToken = exchanged.session?.access_token ?? '';
    refreshToken = exchanged.session?.refresh_token ?? '';
  }

  if (!accessToken || !refreshToken) {
    throw new Error('Google sign-in did not return a secure session.');
  }

  const { error: sessionError } = code
    ? { error: null }
    : await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

  if (sessionError) {
    throw new Error(sessionError.message || 'Unable to finish Google sign-in.');
  }

  const user = await fetchMobileUserWithBearerToken(accessToken);
  const authResponse: MobileAuthResponse = {
    accessToken,
    refreshToken,
    user,
    requiresEmailVerification: false,
  };

  await persistMobileSession(authResponse);
  return createSessionSnapshot(authResponse);
}

export async function loginMobileUserWithFacebook(): Promise<MobileAuthResponse> {
  assertSupabaseConfigured();

  const redirectTo = resolveOAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: 'email,public_profile',
    },
  });

  if (error) {
    throw new Error(error.message || 'Facebook sign-in is not available right now.');
  }

  if (!data.url) {
    throw new Error('Facebook sign-in is not configured for this application.');
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (browserResult.type !== 'success' || !browserResult.url) {
    throw new Error('Facebook sign-in was cancelled.');
  }

  const parsed = new URL(browserResult.url.replace('#', '?'));
  const code = parsed.searchParams.get('code') ?? '';
  let accessToken = parsed.searchParams.get('access_token') ?? '';
  let refreshToken = parsed.searchParams.get('refresh_token') ?? '';

  if (code && (!accessToken || !refreshToken)) {
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw new Error(exchangeError.message || 'Unable to finish Facebook sign-in.');
    }
    accessToken = exchanged.session?.access_token ?? '';
    refreshToken = exchanged.session?.refresh_token ?? '';
  }

  if (!accessToken || !refreshToken) {
    throw new Error('Facebook sign-in did not return a secure session.');
  }

  const { error: sessionError } = code
    ? { error: null }
    : await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

  if (sessionError) {
    throw new Error(sessionError.message || 'Unable to finish Facebook sign-in.');
  }

  const user = await fetchMobileUserWithBearerToken(accessToken);
  const authResponse: MobileAuthResponse = {
    accessToken,
    refreshToken,
    user,
    requiresEmailVerification: false,
  };

  await persistMobileSession(authResponse);
  registerDeviceFireAndForget(accessToken);
  return createSessionSnapshot(authResponse);
}

export async function registerMobileUser(input: RegisterMobileUserInput): Promise<MobileAuthResponse> {
  const response = await apiFetch<RegisterMobileResponse>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      username: input.displayName.trim(),
      role: 'CLIENT',
    }),
  });

  if (response.requiresEmailVerification) {
    return {
      accessToken: undefined,
      user: {
        id: '',
        email: response.pendingEmail ?? input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        role: 'CLIENT',
        createdAt: new Date().toISOString(),
        emailVerifiedAt: null,
      },
      requiresEmailVerification: true,
      message: response.message,
    };
  }

  if (!response.user) {
    throw new Error('Registration completed without a usable session response');
  }

  if (!usesBrowserCookieSession && !response.accessToken) {
    throw new Error('Registration completed without a usable access token');
  }

  const authResponse: MobileAuthResponse = {
    accessToken: response.accessToken,
    user: response.user,
    requiresEmailVerification: false,
  };

  await persistMobileSession(authResponse);
  return createSessionSnapshot(authResponse, false);
}

export async function requestVerificationEmail(
  input: ForgotPasswordInput,
): Promise<AuthActionResponse> {
  return apiFetch<AuthActionResponse>('/v1/auth/email/verify/request', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
    }),
  });
}

export async function verifyMobileEmail(input: VerifyEmailInput): Promise<MobileAuthResponse> {
  const resolvedCode = input.code.trim();
  if (!resolvedCode) {
    throw new Error('Enter the 6-digit verification code from your email.');
  }
  if (resolvedCode.length !== 6) {
    throw new Error('Verification code must be 6 digits.');
  }
  const resolvedEmail = input.email.trim().toLowerCase();
  if (!resolvedEmail) {
    throw new Error('Enter the email address used to create your account.');
  }

  const response = await apiFetch<MobileAuthResponse>('/v1/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({
      code: resolvedCode,
      email: resolvedEmail,
    }),
  });

  if (!response.user) {
    throw new Error('Email verification completed without a user session');
  }

  if (!usesBrowserCookieSession && !response.accessToken) {
    throw new Error('Email verification completed without an access token');
  }

  await persistMobileSession(response);
  return createSessionSnapshot(response);
}

export async function requestMobilePasswordReset(
  input: ForgotPasswordInput,
): Promise<AuthActionResponse> {
  return apiFetch<AuthActionResponse>('/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
    }),
  });
}

export async function resetMobilePassword(
  input: ResetPasswordInput,
): Promise<AuthActionResponse> {
  const resolvedToken = input.token.trim();
  if (!resolvedToken) {
    throw new Error('Enter the 6-digit reset code from your email or use the secure recovery link.');
  }

  return apiFetch<AuthActionResponse>('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: resolvedToken,
      email: input.email?.trim().toLowerCase() || undefined,
      newPassword: input.newPassword,
    }),
  });
}

export async function clearMobileSession(): Promise<void> {
  const storedSession = await readStoredMobileSessionRecord();
  try {
    await apiFetch('/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: !usesBrowserCookieSession ? storedSession?.refreshToken ?? undefined : undefined,
      }),
    });
  } catch {
    // Fall through so local session state is still cleared for the client.
  }

  await authSessionStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
  notifyAuthStateListeners({ accessToken: null, user: null });
}

export async function getStoredMobileSession(): Promise<MobileSessionSnapshot> {
  const storedSession = await readStoredMobileSessionRecord();
  return {
    accessToken: storedSession?.accessToken ?? null,
    user: storedSession?.user ?? null,
  };
}

export async function getValidMobileAccessToken(): Promise<string | null> {
  const storedSession = await readStoredMobileSessionRecord();
  if (!storedSession?.user) {
    return null;
  }

  if (storedSession.accessToken) {
    return storedSession.accessToken;
  }

  if (!storedSession.refreshToken) {
    return null;
  }

  const refreshed = await refreshMobileSessionWithToken(storedSession.refreshToken);
  return refreshed.accessToken;
}

export async function apiFetchWithMobileSession<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (usesBrowserCookieSession) {
    return apiFetch<T>(path, init);
  }

  const storedSession = await readStoredMobileSessionRecord();
  if (!storedSession?.user) {
    throw new Error('Sign in required');
  }

  let accessToken = storedSession.accessToken;
  const execute = async (token: string) =>
    apiFetch<T>(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

  if (!accessToken && storedSession.refreshToken) {
    const refreshed = await refreshMobileSessionWithToken(storedSession.refreshToken);
    accessToken = refreshed.accessToken;
  }

  if (!accessToken) {
    throw new Error('Sign in required');
  }

  try {
    return await execute(accessToken);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      storedSession.refreshToken
    ) {
      const refreshed = await refreshMobileSessionWithToken(storedSession.refreshToken);
      if (!refreshed.accessToken) {
        throw new Error('Sign in required');
      }
      return execute(refreshed.accessToken);
    }

    throw error;
  }
}

// ── Email OTP (passwordless) ──────────────────────────────────────────────────

export async function requestEmailOtp(email: string): Promise<void> {
  await apiFetch('/v1/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'sign_in' }),
  });
}

export async function verifyEmailOtp(email: string, code: string): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: code.trim(),
      purpose: 'sign_in',
    }),
  });
  if (!response.user) throw new Error('Sign-in completed without a user session');
  if (!usesBrowserCookieSession && !response.accessToken) {
    throw new Error('Sign-in completed without an access token');
  }
  await persistMobileSession(response);
  return createSessionSnapshot(response);
}

// ── Trusted devices ───────────────────────────────────────────────────────────

export async function registerTrustedDeviceToken(input: {
  accessToken: string;
  deviceFingerprint: string;
  deviceLabel: string;
  platform: string;
}): Promise<{ token: string; expiresAt: string }> {
  const response = await apiFetch<{ token: string; expiresAt: string }>(
    '/v1/auth/trusted-devices/register',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.accessToken}` },
      body: JSON.stringify({
        deviceFingerprint: input.deviceFingerprint,
        deviceLabel: input.deviceLabel,
        platform: input.platform,
      }),
    },
  );
  return response;
}

export async function signInWithTrustedDeviceToken(token: string): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/trusted-devices/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!response.user) throw new Error('Sign-in completed without a user session');
  if (!usesBrowserCookieSession && !response.accessToken) {
    throw new Error('Sign-in completed without an access token');
  }
  await persistMobileSession(response);
  return createSessionSnapshot(response);
}
