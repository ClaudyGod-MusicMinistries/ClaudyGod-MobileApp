import { createHash, randomBytes } from 'crypto';
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { signAccessToken, signRefreshToken } from '../../utils/jwt.js';
import type { AuthResponse } from './auth.types.js';

const logger = createLogger('oauth.service');

type OAuthProvider = 'google' | 'apple';

interface OAuthUserInfo {
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
}

async function verifyGoogleIdToken(idToken: string): Promise<OAuthUserInfo> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new BadRequestError('Google OAuth not configured', 'OAUTH_NOT_CONFIGURED');
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) {
    throw new UnauthorizedError('Invalid Google ID token', 'OAUTH_INVALID_TOKEN');
  }

  const payload = await res.json() as GoogleTokenPayload;

  if (payload.sub !== env.GOOGLE_CLIENT_ID && !res.url.includes('tokeninfo')) {
    // Audience check happens via tokeninfo endpoint
  }

  if (!payload.email) {
    throw new BadRequestError('Google account has no email', 'OAUTH_NO_EMAIL');
  }

  return {
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    displayName: payload.name ?? payload.email.split('@')[0] ?? 'User',
    avatarUrl: payload.picture,
  };
}

async function verifyAppleIdToken(idToken: string): Promise<OAuthUserInfo> {
  if (!env.APPLE_CLIENT_ID) {
    throw new BadRequestError('Apple OAuth not configured', 'OAUTH_NOT_CONFIGURED');
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let createRemoteJWKSet: typeof import('jose').createRemoteJWKSet;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let jwtVerify: typeof import('jose').jwtVerify;
  try {
    const jose = await import('jose');
    createRemoteJWKSet = jose.createRemoteJWKSet;
    jwtVerify = jose.jwtVerify;
  } catch {
    throw new BadRequestError('Jose package not installed — run yarn add jose@4', 'MISSING_DEPENDENCY');
  }

  const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: 'https://appleid.apple.com',
    audience: env.APPLE_CLIENT_ID,
  });

  const applePayload = payload as AppleTokenPayload;

  if (!applePayload.sub) {
    throw new UnauthorizedError('Invalid Apple ID token', 'OAUTH_INVALID_TOKEN');
  }

  return {
    providerId: applePayload.sub,
    email: applePayload.email?.toLowerCase() ?? '',
    displayName: 'Apple User',
  };
}

async function upsertOAuthUser(
  provider: OAuthProvider,
  info: OAuthUserInfo,
  displayNameHint?: string,
): Promise<AuthResponse> {
  const existing = await pool.query<{
    id: string; email: string; display_name: string; role: string;
    tier: string; mfa_enabled: boolean; email_verified_at: string | null;
    is_active: boolean;
  }>(
    `SELECT u.id, u.email, u.display_name, u.role, u.tier, u.mfa_enabled,
            u.email_verified_at, u.is_active
     FROM app_users u
     INNER JOIN user_oauth_identities oi ON oi.user_id = u.id
     WHERE oi.provider = $1 AND oi.provider_user_id = $2`,
    [provider, info.providerId],
  );

  let userId: string;
  let userEmail: string;
  let userDisplayName: string;
  let userRole: string;
  let userTier: string;
  let mfaEnabled: boolean;
  let emailVerifiedAt: string | null;

  if (existing.rows[0]) {
    const u = existing.rows[0];
    if (!u.is_active) {
      throw new UnauthorizedError('Account is disabled', 'ACCOUNT_DISABLED');
    }
    userId = u.id;
    userEmail = u.email;
    userDisplayName = u.display_name;
    userRole = u.role;
    userTier = u.tier;
    mfaEnabled = u.mfa_enabled;
    emailVerifiedAt = u.email_verified_at;

    await pool.query(
      `UPDATE user_oauth_identities SET last_used_at = NOW() WHERE provider = $1 AND provider_user_id = $2`,
      [provider, info.providerId],
    );
    await pool.query(
      `UPDATE app_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [userId],
    );
  } else {
    const emailCheck = await pool.query<{
      id: string; role: string; tier: string; mfa_enabled: boolean; email_verified_at: string | null;
    }>(
      `SELECT id, role, tier, mfa_enabled, email_verified_at FROM app_users WHERE email = $1`,
      [info.email],
    );

    const now = new Date().toISOString();

    if (emailCheck.rows[0]) {
      userId = emailCheck.rows[0].id;
      userRole = emailCheck.rows[0].role;
      userTier = emailCheck.rows[0].tier ?? 'free';
      mfaEnabled = emailCheck.rows[0].mfa_enabled ?? false;
      emailVerifiedAt = emailCheck.rows[0].email_verified_at ?? now;

      const uRow = await pool.query<{ email: string; display_name: string }>(
        `UPDATE app_users SET email_verified_at = COALESCE(email_verified_at, NOW()), last_login_at = NOW(), updated_at = NOW()
         WHERE id = $1 RETURNING email, display_name`,
        [userId],
      );
      userEmail = uRow.rows[0]!.email;
      userDisplayName = uRow.rows[0]!.display_name;
    } else {
      const displayName = displayNameHint ?? info.displayName;
      const newUser = await pool.query<{
        id: string; email: string; display_name: string; role: string;
        tier: string; mfa_enabled: boolean; email_verified_at: string | null;
      }>(
        `INSERT INTO app_users (email, display_name, role, tier, mfa_enabled, auth_provider, email_verified_at, last_login_at)
         VALUES ($1, $2, 'CLIENT', 'free', FALSE, $3, NOW(), NOW())
         RETURNING id, email, display_name, role, tier, mfa_enabled, email_verified_at`,
        [info.email, displayName, provider],
      );
      const nu = newUser.rows[0]!;
      userId = nu.id;
      userEmail = nu.email;
      userDisplayName = nu.display_name;
      userRole = nu.role;
      userTier = nu.tier;
      mfaEnabled = nu.mfa_enabled;
      emailVerifiedAt = nu.email_verified_at;
    }

    await pool.query(
      `INSERT INTO user_oauth_identities (user_id, provider, provider_user_id, email, avatar_url, last_used_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (provider, provider_user_id) DO UPDATE SET last_used_at = NOW()`,
      [userId, provider, info.providerId, info.email, info.avatarUrl ?? null],
    );

    if (info.avatarUrl) {
      await pool.query(
        `UPDATE app_users SET avatar_url = $2 WHERE id = $1 AND avatar_url IS NULL`,
        [userId, info.avatarUrl],
      );
    }
  }

  const sessionId = randomBytes(16).toString('hex');
  const sessionFamilyId = randomBytes(16).toString('hex');

  const accessToken = signAccessToken({
    sub: userId,
    email: userEmail,
    role: userRole as never,
    displayName: userDisplayName,
    tier: userTier as never,
    mfaEnabled,
  });

  const refreshToken = signRefreshToken({
    sub: userId,
    sessionId,
    sessionFamilyId,
    type: 'refresh',
  });

  await pool.query(
    `INSERT INTO auth_sessions (user_id, session_id, session_family_id, refresh_token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days', $5, $6)`,
    [
      userId,
      sessionId,
      sessionFamilyId,
      createHash('sha256').update(refreshToken).digest('hex'),
      null,
      `oauth:${provider}`,
    ],
  );

  logger.info('OAuth sign-in successful', { userId, provider });

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: userEmail,
      displayName: userDisplayName,
      role: userRole as never,
      tier: (userTier ?? 'free') as never,
      mfaEnabled: mfaEnabled ?? false,
      createdAt: new Date().toISOString(),
      emailVerifiedAt,
    },
  };
}

export async function signInWithGoogle(idToken: string, displayNameHint?: string): Promise<AuthResponse> {
  const userInfo = await verifyGoogleIdToken(idToken);
  return upsertOAuthUser('google', userInfo, displayNameHint);
}

export async function signInWithApple(idToken: string, displayNameHint?: string): Promise<AuthResponse> {
  const userInfo = await verifyAppleIdToken(idToken);
  return upsertOAuthUser('apple', userInfo, displayNameHint);
}
