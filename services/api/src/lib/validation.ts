import type { z } from 'zod';
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
