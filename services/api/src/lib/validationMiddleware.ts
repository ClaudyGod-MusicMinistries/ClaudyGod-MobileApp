import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError';

export const validateBody = (schema: ZodSchema): RequestHandler => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new HttpError(400, 'Request validation failed', {
            errors: error.flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema): RequestHandler => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new HttpError(400, 'Query validation failed', {
            errors: error.flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema): RequestHandler => {
  return async (req, res, next) => {
    try {
      req.validated = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new HttpError(400, 'Parameter validation failed', {
            errors: error.flatten().fieldErrors,
          })
        );
      }
      next(error);
    }
  };
};

/**
 * Wraps async route handlers to automatically catch errors
 * Without this, unhandled promise rejections will crash the server
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
