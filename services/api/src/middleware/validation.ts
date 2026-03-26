// middleware/validation.ts
/**
 * Request Validation Middleware
 * Validates incoming request bodies using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema for validation
 */
export const validationMiddleware = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors || [{ message: error.message }],
        },
      });
    }
  };
};
