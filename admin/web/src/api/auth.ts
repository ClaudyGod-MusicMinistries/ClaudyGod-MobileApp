import client from './client';
import type { LoginResponse, AdminUser } from './types';

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  adminSignupCode: string;
  role: 'ADMIN';
}

export interface RegisterResponse {
  message: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/v1/auth/login', { email, password });
  return data;
}

export async function loginWithMfa(mfaToken: string, code: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/v1/auth/mfa/verify', { mfaToken, code });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await client.post('/v1/auth/logout', { refreshToken });
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await client.get<AdminUser>('/v1/me');
  return data;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await client.post<RegisterResponse>('/v1/auth/register', input);
  return data;
}

export const GOOGLE_LOGIN_URL = import.meta.env.VITE_GOOGLE_LOGIN_URL || '';
