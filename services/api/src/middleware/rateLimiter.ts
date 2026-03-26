import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => process.env.NODE_ENV === 'development',
});

// Strict rate limiter for auth attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => process.env.NODE_ENV === 'development',
  keyGenerator: (req: Request) => {
    // Rate limit by IP + email combination
    return `${req.ip}-${((req.body as any)?.email || 'unknown').toLowerCase()}`;
  },
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => process.env.NODE_ENV === 'development',
});

// Email verification limiter
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 verification attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => process.env.NODE_ENV === 'development',
});

// Alias for backward compatibility
export const emailVerifyLimiter = emailVerificationLimiter;
