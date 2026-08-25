import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimiter';
import { UnauthorizedError } from '../../lib/errors';
import { issueAuthSession } from './authSession.service';
import { respondWithAuthSession } from './authSessionCookie';
import { getUserById } from './auth.service';

export const oauthBrokerRouter = Router();
type ProviderAvailability = { google: boolean; apple: boolean };
let providerCache: { value: ProviderAvailability; expiresAt: number } | null = null;

async function getProviderAvailability(): Promise<ProviderAvailability> {
  if (providerCache && providerCache.expiresAt > Date.now()) return providerCache.value;
  if (!env.SUPABASE_ENABLED) return { google: false, apple: false };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/settings`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY }, signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Supabase auth settings returned ${response.status}`);
    const payload = await response.json() as { external?: Record<string, boolean> };
    const value = { google: payload.external?.google === true, apple: payload.external?.apple === true };
    providerCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
    return value;
  } catch {
    return { google: false, apple: false };
  }
}

oauthBrokerRouter.get('/providers', asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.status(200).json({ providers: await getProviderAvailability() });
}));

oauthBrokerRouter.post('/exchange', authLimiter, authenticate, asyncHandler(async (req: Request, res) => {
  if (!req.user) throw new UnauthorizedError('OAuth identity could not be verified', 'OAUTH_IDENTITY_REQUIRED');
  const session = await issueAuthSession(await getUserById(req.user.sub), {
    requestIp: req.ip, userAgent: req.header('user-agent') || undefined,
    deviceFingerprint: typeof req.body?.deviceFingerprint === 'string' ? req.body.deviceFingerprint : undefined,
    platform: typeof req.body?.platform === 'string' ? req.body.platform : undefined,
  });
  respondWithAuthSession(req, res, session, 200);
}));
