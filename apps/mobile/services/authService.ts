import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface StoredMobileSession {
  accessToken: string;
  user: MobileAuthUser;
}

interface MobileSessionSnapshot {
  accessToken: string | null;
  user: MobileAuthUser | null;
}

const MOBILE_AUTH_STORAGE_KEY = 'claudygod.mobile-auth-session.v1';
const authStateListeners = new Set<(_snapshot: MobileSessionSnapshot) => void>();

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

const parseStoredMobileSession = (raw: string | null): MobileSessionSnapshot => {
  if (!raw) {
    return { accessToken: null, user: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredMobileSession>;
    if (typeof parsed.accessToken !== 'string' || !isMobileAuthUser(parsed.user)) {
      return { accessToken: null, user: null };
    }

    return {
      accessToken: parsed.accessToken,
      user: parsed.user,
    };
  } catch {
    return { accessToken: null, user: null };
  }
};

const notifyAuthStateListeners = (snapshot: MobileSessionSnapshot): void => {
  authStateListeners.forEach((listener) => {
    listener(snapshot);
  });
};

const persistMobileSession = async (response: Pick<MobileAuthResponse, 'accessToken' | 'user'>) => {
  const nextSession: StoredMobileSession = {
    accessToken: response.accessToken,
    user: response.user,
  };

  await AsyncStorage.setItem(MOBILE_AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  notifyAuthStateListeners(nextSession);
};

const createSessionSnapshot = (
  payload: MobileAuthResponse,
  requiresEmailVerification = false,
): MobileAuthResponse => ({
  accessToken: payload.accessToken,
  user: payload.user,
  requiresEmailVerification,
});

export const subscribeToMobileAuthStateChange = (
  listener: (_snapshot: MobileSessionSnapshot) => void,
): (() => void) => {
  authStateListeners.add(listener);
  return () => {
    authStateListeners.delete(listener);
  };
};

export async function loginMobileUser(input: {
  email: string;
  password: string;
}): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });

  await persistMobileSession(response);
  return createSessionSnapshot(response);
}

export async function registerMobileUser(input: RegisterMobileUserInput): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      username: input.displayName.trim(),
      role: 'CLIENT',
    }),
  });

  if (!response.requiresEmailVerification) {
    await persistMobileSession(response);
  }

  return createSessionSnapshot(response, Boolean(response.requiresEmailVerification));
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
  const resolvedToken = input.token.trim();
  if (!resolvedToken) {
    throw new Error('Open the verification link from your email or paste the verification token.');
  }

  const response = await apiFetch<MobileAuthResponse>('/v1/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({
      token: resolvedToken,
    }),
  });

  await persistMobileSession(response);
  return createSessionSnapshot(response);
}

export async function requestMobilePasswordReset(
  input: ForgotPasswordInput,
): Promise<AuthActionResponse> {
  return apiFetch<AuthActionResponse>('/v1/auth/password/forgot', {
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
    throw new Error('Open the reset link from your email or paste the reset token.');
  }

  return apiFetch<AuthActionResponse>('/v1/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({
      token: resolvedToken,
      newPassword: input.newPassword,
    }),
  });
}

export async function clearMobileSession(): Promise<void> {
  await AsyncStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
  notifyAuthStateListeners({ accessToken: null, user: null });
}

export async function getStoredMobileSession(): Promise<MobileSessionSnapshot> {
  const storedSession = await AsyncStorage.getItem(MOBILE_AUTH_STORAGE_KEY);
  const parsed = parseStoredMobileSession(storedSession);

  if (storedSession && !parsed.accessToken) {
    await AsyncStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
  }

  return parsed;
}
