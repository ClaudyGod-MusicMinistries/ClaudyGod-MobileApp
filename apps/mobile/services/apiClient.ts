import { Platform } from 'react-native';
import { ENV } from './config';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ENV.apiUrl) {
    throw new Error(
      ENV.isProduction
        ? 'Mobile API is not configured. Set EXPO_PUBLIC_API_URL for production builds.'
        : 'Mobile API is not configured. Set EXPO_PUBLIC_API_URL or run Expo and the API on the same LAN so the app can derive http://<expo-host>:4000.',
    );
  }

  const response = await fetch(`${ENV.apiUrl}${path}`, {
    ...init,
    credentials: Platform.OS === 'web' ? 'include' : init?.credentials,
    headers: {
      'Content-Type': 'application/json',
      'X-Claudy-Client-Platform': Platform.OS,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = '';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = (await response.json()) as { message?: string; error?: string };
        message = payload.message || payload.error || '';
      } else {
        message = await response.text();
      }
    } catch {
      message = '';
    }
    throw new Error(message || `API request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
