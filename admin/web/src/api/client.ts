import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { resolveApiUrl } from '@/utils/constants';
import { normalizeApiError } from './apiError';
import { getAccessToken, notifySessionExpired, refreshSession } from './session';

export { clearAccessToken, clearRefreshToken, getAccessToken, getRefreshToken, refreshSession, setAccessToken, setRefreshToken } from './session';

export const API_URL = resolveApiUrl();

export const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

// In-memory access token — never written to localStorage.
// ─── Request interceptor ─────────────────────────────────────────────────────

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(normalizeApiError(error));
    }

    original._retry = true;

    try {
      const session = await refreshSession();
      original.headers.Authorization = `Bearer ${session.accessToken}`;
      return client(original);
    } catch {
      notifySessionExpired();
      return Promise.reject(normalizeApiError(error));
    }
  },
);

export default client;
