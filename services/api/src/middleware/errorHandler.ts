import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;
  let code: string | undefined = undefined;
  let field: string | undefined = undefined;

  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
    code = error.code || (typeof error.details === 'object' && error.details ? (error.details as any).code : undefined);
    field =
      error.field || (typeof error.details === 'object' && error.details ? (error.details as any).field : undefined);
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.flatten();
    code = 'VALIDATION_ERROR';
  } else if (error instanceof Error && env.NODE_ENV !== 'production') {
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: message,
    message,
    code: code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    field,
    details,
  });
};
