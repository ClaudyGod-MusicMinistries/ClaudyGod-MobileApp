import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from './errors';

export const validateSchema = <S extends z.ZodTypeAny>(schema: S, value: unknown): z.output<S> => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new HttpError(400, 'Validation failed', {
      code: 'VALIDATION_ERROR',
      ...result.error.flatten(),
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        code: issue.code,
        message: issue.message,
      })),
    });
  }

  return result.data;
};

type RequestInput = 'body' | 'query' | 'params';

const validateRequest = (source: RequestInput, schema: z.ZodTypeAny): RequestHandler =>
  async (req, _res, next) => {
    try {
      req.validated = await schema.parseAsync(req[source]);
      next();
    } catch (error) {
      if (!(error instanceof z.ZodError)) {
        next(error);
        return;
      }

      next(
        new HttpError(400, `${source[0].toUpperCase()}${source.slice(1)} validation failed`, {
          code: 'VALIDATION_ERROR',
          ...error.flatten(),
          issues: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: issue.code,
            message: issue.message,
          })),
        }),
      );
    }
  };

export const validateBody = (schema: z.ZodTypeAny): RequestHandler =>
  validateRequest('body', schema);

export const validateQuery = (schema: z.ZodTypeAny): RequestHandler =>
  validateRequest('query', schema);

export const validateParams = (schema: z.ZodTypeAny): RequestHandler =>
  validateRequest('params', schema);
