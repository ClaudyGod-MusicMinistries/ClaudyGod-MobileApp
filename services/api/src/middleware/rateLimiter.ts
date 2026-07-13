import rateLimit from 'express-rate-limit';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import type { Request, Response, NextFunction } from 'express';
import { resolveAuthenticatedUser } from '../modules/auth/authIdentity.service';
import { hasMinRole } from '../modules/auth/auth.types';
import { redis } from '../infra/redis';
import { rateLimitRejectedTotal } from '../lib/metrics';

// Records a rejection in Prometheus before falling back to express-rate-limit's
// own default response (status + message), so Grafana can show which limiter is
// actually firing in production instead of everyone finding out via a pasted
// console error, as happened before this was added.
const rejectionHandler = (name: string) =>
  (_req: Request, res: Response, _next: NextFunction, options: RateLimitOptions) => {
    rateLimitRejectedTotal.inc({ limiter: name });
    res.status(options.statusCode).send(options.message);
  };

// Backs every limiter below with the same Redis connection already used
// elsewhere in the app (services/api/src/infra/redis.ts) instead of
// express-rate-limit's default in-memory store, which silently resets on
// every restart/redeploy and can't be trusted as the real record of who's
// been rate limited. Each limiter gets its own key prefix so they don't
// share counters with each other.
//
// Omitted entirely under Jest: RedisStore's constructor eagerly loads its Lua
// scripts into Redis the moment it's created (before any request happens),
// and this test environment has no reachable Redis (REDIS_URL in the repo's
// .env.development points at the `redis` Docker Compose hostname, which
// doesn't resolve outside Docker — the same pre-existing condition
// jest.config.js already documents for BullMQ). Falling back to
// express-rate-limit's default in-memory store under test matches exactly
// how these limiters already behaved before this change.
const redisStore = (prefix: string): RedisStore | undefined =>
  process.env.NODE_ENV === 'test'
    ? undefined
    : new RedisStore({
        sendCommand: (...args: string[]) =>
          redis.call(...(args as [string, ...string[]])) as Promise<RedisReply>,
        prefix: `rl:${prefix}:`,
      });

// Exempts logged-in admin-portal staff (MODERATOR+) from the general public-facing
// limiter below — the limiter exists to blunt abuse from anonymous/public traffic
// (the mobile app's public endpoints), not to throttle a human admin's own dashboard,
// which routinely makes well over 100 requests in 15 minutes during normal use
// (page loads, YouTube browsing/pagination, bulk actions). Regular CLIENT-tier
// end users (the mobile app's own logged-in consumers) still get rate-limited
// normally — only MODERATOR+ staff sessions are exempt.
async function isStaffSession(req: Request): Promise<boolean> {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;
  try {
    const user = await resolveAuthenticatedUser(authorization.slice('Bearer '.length).trim());
    return hasMinRole(user.role, 'MODERATOR');
  } catch {
    return false;
  }
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('api'),
  handler: rejectionHandler('api'),
  skip: async (req: Request) =>
    process.env.NODE_ENV === 'development' || isStaffSession(req),
});

// Strict rate limiter for auth attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('auth'),
  handler: rejectionHandler('auth'),
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
  store: redisStore('password-reset'),
  handler: rejectionHandler('password-reset'),
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Email verification limiter
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 verification attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('email-verify'),
  handler: rejectionHandler('email-verify'),
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
  store: redisStore('invite'),
  handler: rejectionHandler('invite'),
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Access request limiter — 3 requests per hour per IP to prevent spam
export const accessRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many access requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('access-request'),
  handler: rejectionHandler('access-request'),
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
});

// Content request limiter — per authenticated user (5 per hour)
export const contentRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many content requests. Please wait before submitting another.',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('content-request'),
  handler: rejectionHandler('content-request'),
  skip: (_req: Request) => process.env.NODE_ENV === 'development',
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { sub?: string } }).user;
    return user?.sub ?? req.ip ?? 'unknown';
  },
});
