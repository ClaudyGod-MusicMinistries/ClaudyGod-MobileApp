import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { HttpError } from '../lib/errors';
import { logger } from '../lib/logger';
import { Sentry } from '../lib/sentry';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;
  let code: string | undefined = undefined;
  let field: string | undefined = undefined;

  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
    code = error.code || (typeof error.details === 'object' && error.details ? (error.details as Record<string, unknown>)['code'] as string | undefined : undefined);
    field =
      error.field || (typeof error.details === 'object' && error.details ? (error.details as Record<string, unknown>)['field'] as string | undefined : undefined);
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.flatten();
    code = 'VALIDATION_ERROR';
  } else if (error instanceof Error && env.NODE_ENV !== 'production') {
    message = error.message;
  }

  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      statusCode,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Only genuine server-side failures go to Sentry — 4xx (validation, auth,
    // not-found) are normal, expected traffic and would just be noise/quota
    // burn if reported the same way as a real 500.
    Sentry.captureException(error, {
      contexts: { request: { requestId: req.id, method: req.method, path: req.path } },
    });
  }

  res.status(statusCode).json({
    error: message,
    message,
    code: code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    field,
    details,
    requestId: req.id,
  });
};
