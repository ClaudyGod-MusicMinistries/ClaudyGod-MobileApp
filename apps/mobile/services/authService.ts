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

const ACCESS_TOKEN_STORAGE_KEY = 'claudygod_mobile_access_token';
const USER_STORAGE_KEY = 'claudygod_mobile_user';

export async function loginMobileUser(input: {
  email: string;
  password: string;
}): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await persistSessionWhenVerified(response);
  return response;
}

export async function registerMobileUser(input: RegisterMobileUserInput): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await persistSessionWhenVerified(response);
  return response;
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
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({
      token: input.token.trim(),
    }),
  });
  await persistMobileSession(response);
  return response;
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
  return apiFetch<AuthActionResponse>('/v1/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({
      token: input.token.trim(),
      newPassword: input.newPassword,
    }),
  });
}

async function persistSessionWhenVerified(session: MobileAuthResponse): Promise<void> {
  if (session.requiresEmailVerification) {
    await clearMobileSession();
    return;
  }

  await persistMobileSession(session);
}

export async function persistMobileSession(session: MobileAuthResponse): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_STORAGE_KEY, session.accessToken],
    [USER_STORAGE_KEY, JSON.stringify(session.user)],
  ]);
}

export async function clearMobileSession(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
}

export async function getStoredMobileSession(): Promise<{
  accessToken: string | null;
  user: MobileAuthUser | null;
}> {
  const [token, userRaw] = await AsyncStorage.multiGet([ACCESS_TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
  const accessToken = token?.[1] ?? null;
  const user = userRaw?.[1] ? (JSON.parse(userRaw[1]) as MobileAuthUser) : null;
  return { accessToken, user };
}
