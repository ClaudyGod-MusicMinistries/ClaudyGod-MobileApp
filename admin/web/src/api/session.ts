import { resolveApiUrl } from '@/utils/constants';
import type { AdminSessionResponse, SessionStatusResponse } from './types';

const API_URL = resolveApiUrl();
let refreshInFlight: Promise<AdminSessionResponse> | null = null;
const expirationListeners = new Set<() => void>();

export function clearSession(): void {
  // Authentication cookies are HttpOnly and can only be cleared by the API.
}

export function onSessionExpired(listener: () => void): () => void {
  expirationListeners.add(listener);
  return () => expirationListeners.delete(listener);
}

export function notifySessionExpired(): void {
  clearSession();
  expirationListeners.forEach((listener) => listener());
}

const sessionRequest = async <T>(path: string, method: 'GET' | 'POST'): Promise<T> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    // Session discovery is a credentialed, read-only GET. Keep it a CORS
    // safelisted request so the login page does not depend on an avoidable
    // preflight before it can determine authentication state. Mutating refresh
    // requests retain JSON and observability headers.
    const headers: HeadersInit = method === 'GET'
      ? { Accept: 'application/json' }
      : {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Claudy-Client-Platform': 'web',
          'X-Request-ID': crypto.randomUUID(),
        };

    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: method === 'POST' ? '{}' : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Your session has expired. Please sign in again.');
    return await response.json() as T;
  } finally {
    window.clearTimeout(timeout);
  }
};

export function restoreSession(): Promise<SessionStatusResponse> {
  return sessionRequest<SessionStatusResponse>('/v1/auth/session', 'GET');
}

export function refreshSession(): Promise<AdminSessionResponse> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = sessionRequest<AdminSessionResponse>('/v1/auth/refresh', 'POST').then((session) => {
    if (!session?.user) {
      throw new Error('The server returned an invalid session. Please sign in again.');
    }
    return session;
  }).finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
