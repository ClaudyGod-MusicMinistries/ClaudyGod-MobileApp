import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './apiClient';

export interface MobileAuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
}

export interface MobileAuthResponse {
  accessToken: string;
  user: MobileAuthUser;
}

export interface RegisterMobileUserInput {
  email: string;
  password: string;
  displayName: string;
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
  await persistMobileSession(response);
  return response;
}

export async function registerMobileUser(input: RegisterMobileUserInput): Promise<MobileAuthResponse> {
  const response = await apiFetch<MobileAuthResponse>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await persistMobileSession(response);
  return response;
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
