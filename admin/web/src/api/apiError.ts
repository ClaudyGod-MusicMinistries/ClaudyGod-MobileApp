import axios from 'axios';

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  message?: string;
  error?: string;
  requestId?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly cause: unknown;

  constructor(message: string, options: {
    status?: number;
    code?: string;
    requestId?: string;
    retryable?: boolean;
    cause?: unknown;
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError<ApiProblem>(error)) {
    const problem = error.response?.data;
    const status = error.response?.status;
    const gatewayMessage = status === 502
      ? 'The sign-in service is temporarily unavailable. Your code was not accepted; please wait a moment and request a new code.'
      : undefined;
    const message = gatewayMessage
      ?? text(problem?.detail)
      ?? text(problem?.message)
      ?? text(problem?.error)
      ?? text(problem?.title)
      ?? (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : undefined)
      ?? (error.response ? `The server could not complete the request (${status}).` : 'The service is unreachable. Check your connection and try again.');

    return new ApiError(message, {
      status,
      code: text(problem?.code) ?? error.code,
      requestId: text(problem?.requestId)
        ?? text(problem?.correlationId)
        ?? text(error.response?.headers?.['x-request-id']),
      retryable: !status || status === 408 || status === 429 || status >= 500,
      cause: error,
    });
  }

  return new ApiError(error instanceof Error ? error.message : 'An unexpected error occurred.', { cause: error });
}

export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
