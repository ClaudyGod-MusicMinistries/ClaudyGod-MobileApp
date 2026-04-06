export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly code?: string;
  public readonly field?: string;

  constructor(statusCode: number, message: string, details?: unknown, code?: string, field?: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.field = field;
  }
}
