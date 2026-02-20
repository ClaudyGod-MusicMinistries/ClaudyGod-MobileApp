import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;

  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.flatten();
  } else if (error instanceof Error && env.NODE_ENV !== 'production') {
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: message,
    details,
  });
};
