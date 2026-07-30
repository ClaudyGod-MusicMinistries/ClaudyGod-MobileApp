import { resolveApiUrl, REFRESH_TOKEN_KEY } from '@/utils/constants';
import type { RefreshResponse } from './types';

const API_URL = resolveApiUrl();
let accessToken = '';
let refreshInFlight: Promise<RefreshResponse> | null = null;
const expirationListeners = new Set<() => void>();

export function getAccessToken(): string { return accessToken; }
export function setAccessToken(token: string): void { accessToken = token; }
export function clearAccessToken(): void { accessToken = ''; }

export function getRefreshToken(): string {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY) || ''; } catch { return ''; }
}

export function setRefreshToken(token: string): void {
  try { localStorage.setItem(REFRESH_TOKEN_KEY, token); } catch { /* private/blocked storage */ }
}

export function clearRefreshToken(): void {
  try { localStorage.removeItem(REFRESH_TOKEN_KEY); } catch { /* private/blocked storage */ }
}

export function clearSession(): void {
  clearAccessToken();
  clearRefreshToken();
}

export function onSessionExpired(listener: () => void): () => void {
  expirationListeners.add(listener);
  return () => expirationListeners.delete(listener);
}

export function notifySessionExpired(): void {
  clearSession();
  expirationListeners.forEach((listener) => listener());
}

export function refreshSession(): Promise<RefreshResponse> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error('No refresh session is available.'));

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  refreshInFlight = fetch(`${API_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) throw new Error('Your session has expired. Please sign in again.');
    const session = await response.json() as RefreshResponse;
    if (!session || typeof session.accessToken !== 'string' || typeof session.refreshToken !== 'string' || !session.user) {
      throw new Error('The server returned an invalid session. Please sign in again.');
    }
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    return session;
  }).finally(() => {
    window.clearTimeout(timeout);
    refreshInFlight = null;
  });

  return refreshInFlight;
}
