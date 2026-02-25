import { z } from 'zod';
import { HttpError } from './httpError';

export const validateSchema = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new HttpError(400, 'Validation failed', {
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
