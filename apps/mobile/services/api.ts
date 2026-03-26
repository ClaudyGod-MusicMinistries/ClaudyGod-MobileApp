// Mobile API service - uses native fetch on top of apiClient
// All requests go through apiClient.ts which has proper error handling and timeout logic

import { apiFetch, ApiError } from './apiClient';
import { authSessionStorage } from '../lib/authSessionStorage';

/**
 * Wrapper for authenticated API requests
 * Automatically includes auth token and handles refresh
 */
export async function authenticatedFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await authSessionStorage.restoreSession();
  
  if (!session.accessToken) {
    throw new ApiError(
      401,
      'Not authenticated. Please sign in.',
    );
  }

  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}

/**
 * Refresh authentication token
 */
export async function refreshAuthToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  return apiFetch<{
    accessToken: string;
    refreshToken: string;
  }>('/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Public API request (no auth required)
 */
export async function publicFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, init);
}
