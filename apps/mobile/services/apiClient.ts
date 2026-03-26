import { Platform } from 'react-native';
import { ENV } from './config';

export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;
  isTimeout: boolean;

  constructor(status: number, message: string, isNetworkError = false, isTimeout = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeout: number = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        408,
        'Request timeout. Please check your internet connection and try again.',
        false,
        true,
      );
    }
    throw error;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ENV.apiUrl) {
    throw new ApiError(
      503,
      'Service temporarily unavailable. Please try again shortly.',
    );
  }

  try {
    const response = await fetchWithTimeout(`${ENV.apiUrl}${path}`, {
      ...init,
      credentials: Platform.OS === 'web' ? 'include' : init?.credentials,
      headers: {
        'Content-Type': 'application/json',
        'X-Claudy-Client-Platform': Platform.OS,
        'X-Claudy-Client-Version': '1.0.0',
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

      const errorMessage =
        message ||
        {
          400: 'Invalid request. Please check your input.',
          401: 'Unauthorized. Please sign in again.',
          403: 'Access forbidden.',
          404: 'Resource not found.',
          429: 'Too many requests. Please try again later.',
          500: 'Server error. Please try again later.',
          503: 'Service unavailable. Please try again shortly.',
        }[response.status] ||
        `Request failed with status ${response.status}`;

      throw new ApiError(response.status, errorMessage);
    }

    return (await response.json()) as T;
  } catch (error) {
    // Handle network errors
    if (
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed') ||
        error.message.includes('fetch is not defined'))
    ) {
      throw new ApiError(
        0,
        'Network connection failed. Please check your internet connection.',
        true,
      );
    }

    // Re-throw ApiError as is
    if (error instanceof ApiError) {
      throw error;
    }

    // Unknown error
    console.error('[apiFetch] Unexpected error:', error);
    throw new ApiError(
      500,
      'An unexpected error occurred. Please try again.',
    );
  }
}
