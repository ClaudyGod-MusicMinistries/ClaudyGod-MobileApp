import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email();

const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must contain at least 2 characters')
  .max(80, 'Display name must contain at most 80 characters')
  .regex(/^[\p{L}\p{N} .,'_-]+$/u, 'Display name contains unsupported characters');

const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .max(72, 'Password must contain at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
    role: z.enum(['CLIENT', 'ADMIN']).optional(),
    adminSignupCode: z.string().trim().min(8).max(128).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(72),
  })
  .strict();
