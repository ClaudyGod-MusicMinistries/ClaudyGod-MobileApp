export { HttpError } from './httpError';
import { HttpError } from './httpError';

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', code?: string, field?: string) {
    super(400, message, undefined, code ?? 'BAD_REQUEST', field);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', code?: string) {
    super(401, message, undefined, code ?? 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', code?: string) {
    super(403, message, undefined, code ?? 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found', code?: string) {
    super(404, message, undefined, code ?? 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', code?: string, field?: string) {
    super(409, message, undefined, code ?? 'CONFLICT', field);
    this.name = 'ConflictError';
  }
}

export class UnprocessableError extends HttpError {
  constructor(message = 'Unprocessable entity', details?: unknown, code?: string) {
    super(422, message, details, code ?? 'UNPROCESSABLE');
    this.name = 'UnprocessableError';
  }
}

export class InternalError extends HttpError {
  constructor(message = 'Internal server error', code?: string) {
    super(500, message, undefined, code ?? 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}
