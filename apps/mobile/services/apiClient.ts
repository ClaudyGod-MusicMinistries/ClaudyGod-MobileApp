import { ENV } from './config';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ENV.apiUrl) {
    throw new Error(
      'Mobile API is not configured. Set EXPO_PUBLIC_API_URL only if you want to use the optional backend services.',
    );
  }

  const response = await fetch(`${ENV.apiUrl.replace(/\/+$/, '')}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
