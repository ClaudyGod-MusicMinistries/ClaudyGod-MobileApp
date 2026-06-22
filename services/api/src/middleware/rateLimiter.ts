import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Strict rate limiter for auth attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
  keyGenerator: (req: Request) => {
    // Rate limit by IP + email combination
    const body = req.body as Record<string, unknown>;
    const email = typeof body?.email === 'string' ? body.email : 'unknown';
    return `${req.ip}-${email.toLowerCase()}`;
  },
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Email verification limiter
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 verification attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Alias for backward compatibility
export const emailVerifyLimiter = emailVerificationLimiter;

// Invite token limiter — prevents brute-force of invite tokens (10 per hour per IP)
export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many invite attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Access request limiter — 3 requests per hour per IP to prevent spam
export const accessRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many access requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Content request limiter — per authenticated user (5 per hour)
export const contentRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many content requests. Please wait before submitting another.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { sub?: string } }).user;
    return user?.sub ?? req.ip ?? 'unknown';
  },
});
