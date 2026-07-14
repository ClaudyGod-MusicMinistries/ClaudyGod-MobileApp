import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { resolveApiUrl, REFRESH_TOKEN_KEY } from '@/utils/constants';
import type { RefreshResponse } from './types';

export const API_URL = resolveApiUrl();

export const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

// In-memory access token — never written to localStorage.
let _accessToken = '';
let _refreshing: Promise<string> | null = null;

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function getAccessToken(): string {
  return _accessToken;
}

export function clearAccessToken(): void {
  _accessToken = '';
}

export function getRefreshToken(): string {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY) || ''; }
  catch { return ''; }
}

export function setRefreshToken(token: string): void {
  try { localStorage.setItem(REFRESH_TOKEN_KEY, token); }
  catch { /* storage blocked */ }
}

export function clearRefreshToken(): void {
  try { localStorage.removeItem(REFRESH_TOKEN_KEY); }
  catch { /* storage blocked */ }
}

// ─── Request interceptor ─────────────────────────────────────────────────────

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── Response interceptor (auto-refresh on 401) ───────────────────────────────

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // The API always responds with a real, human-readable reason in its JSON body
    // ({ message, error, code, ... } — see services/api/src/middleware/errorHandler.ts)
    // but axios's own error.message defaults to a generic "Request failed with status
    // code 403"-style string. Surface the backend's actual message here, once,
    // centrally — every existing `e.message` toast across the app benefits instead
    // of each call site needing to know to reach into `error.response.data`.
    const backendMessage = error.response?.data?.message || error.response?.data?.error;
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      error.message = backendMessage;
    }

    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error as Error);
    }

    original._retry = true;

    try {
      // Deduplicate concurrent 401s — only one refresh flight at a time.
      if (!_refreshing) {
        _refreshing = (async () => {
          const rt = getRefreshToken();
          if (!rt) throw new Error('No refresh token');
          const { data } = await axios.post<RefreshResponse>(
            `${API_URL}/v1/auth/refresh`,
            { refreshToken: rt },
          );
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);
          return data.accessToken;
        })().finally(() => { _refreshing = null; });
      }

      await _refreshing;

      original.headers.Authorization = `Bearer ${_accessToken}`;
      return client(original);
    } catch {
      // Refresh failed — trigger logout via auth store.
      clearAccessToken();
      clearRefreshToken();
      // Dynamically import to avoid circular dep with the store.
      const { useAuthStore } = await import('@/stores/auth.store');
      useAuthStore().logout();
      return Promise.reject(error as Error);
    }
  },
);

export default client;
