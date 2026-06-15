import client from './client';
import type { LoginResponse, AdminUser } from './types';

export interface InviteValidation {
  id: string;
  email: string;
  role: string;
  inviterName: string | null;
  expiresAt: string;
}

export interface AdminInviteListItem {
  id: string;
  email: string;
  role: string;
  inviterName: string | null;
  expiresAt: string;
  createdAt: string;
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

export async function verifyEmail(code: string, email: string): Promise<void> {
  await client.post('/v1/auth/email/verify', { code, email });
}

export async function validateInvite(token: string): Promise<InviteValidation> {
  const { data } = await client.get<InviteValidation>('/v1/auth/invitations/validate', {
    params: { token },
  });
  return data;
}

export async function acceptInvite(input: {
  token: string;
  name: string;
  displayName: string;
  password: string;
}): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/v1/auth/invitations/accept', input);
  return data;
}

export async function sendAdminInvite(email: string, role: string): Promise<{ id: string; expiresAt: string }> {
  const { data } = await client.post<{ id: string; expiresAt: string }>('/v1/admin/invitations', { email, role });
  return data;
}

export async function listAdminInvites(): Promise<{ invitations: AdminInviteListItem[] }> {
  const { data } = await client.get<{ invitations: AdminInviteListItem[] }>('/v1/admin/invitations');
  return data;
}

export async function revokeAdminInvite(id: string): Promise<void> {
  await client.delete(`/v1/admin/invitations/${id}`);
}

export const GOOGLE_LOGIN_URL = import.meta.env.VITE_GOOGLE_LOGIN_URL || '';
