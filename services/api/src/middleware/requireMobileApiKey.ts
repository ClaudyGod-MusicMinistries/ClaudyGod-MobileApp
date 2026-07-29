import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { UnauthorizedError } from '../lib/errors';

export const requireMobileApiKey: RequestHandler = (req, _res, next) => {
  const apiKey = req.header('x-mobile-api-key')?.trim();

  // Primary path: correct API key present (native iOS/Android builds).
  if (apiKey && apiKey === env.MOBILE_API_KEY) {
    next();
    return;
  }

  // Secondary path: web build of the same app.
  // The web export cannot embed secrets in a public bundle, so we accept
  // requests that self-identify as the web platform via the client header.
  // These requests still go through CORS and rate-limiting, and personal
  // data routes additionally require a valid Bearer token via authenticate().
  //
  // IMPORTANT: this header is trivially spoofable by any HTTP client — it is a
  // soft client-identification signal only, NOT a security boundary. Never rely
  // on this middleware alone to gate a sensitive action; every route that needs
  // real authorization must additionally require `authenticate` + a role check
  // (see middleware/rbac.ts). See docs/RUNBOOK.md for the full write-up.
  const platform = req.header('x-claudy-client-platform');
  if (platform === 'web') {
    next();
    return;
  }

  next(new UnauthorizedError('Invalid mobile API key', 'INVALID_MOBILE_API_KEY'));
};
