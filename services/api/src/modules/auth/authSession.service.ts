import { createHash, randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { registerDevice } from '../devices/devices.service';
import type { AuthResponse, SafeUser, UserRole, UserTier } from './auth.types';

interface QueryRunner {
  query: PoolClient['query'];
}

interface SessionUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  tier: string;
  mfa_enabled: boolean;
  is_active: boolean;
  created_at: string | Date;
  email_verified_at: string | Date | null;
}

interface RefreshSessionRow {
  id: string;
  user_id: string;
  session_family_id: string;
  refresh_token_hash: string;
  revoked_at: string | Date | null;
  expires_at: string | Date;
  device_id: string | null;
}

export interface AuthSessionContext {
  requestIp?: string;
  userAgent?: string;
  // When present, the session gets linked to a real user_devices row (created
  // or updated via the same upsert the explicit device-registration endpoint
  // uses) so that revoking that device can actually invalidate this session —
  // previously the two were entirely unlinked.
  deviceFingerprint?: string;
  deviceName?: string;
  platform?: string;
}

const toIsoDate = (value: string | Date): string => new Date(value).toISOString();
const toIsoDateOrNull = (value: string | Date | null): string | null =>
  value ? toIsoDate(value) : null;

const toSafeUser = (row: SessionUserRow): SafeUser => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  tier: (row.tier ?? 'free') as UserTier,
  mfaEnabled: row.mfa_enabled ?? false,
  createdAt: toIsoDate(row.created_at),
  emailVerifiedAt: toIsoDateOrNull(row.email_verified_at),
});

const tokenHash = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const getRefreshExpiryDate = (): Date =>
  new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

const loadSessionUser = async (
  userId: string,
  runner: QueryRunner = pool,
): Promise<SafeUser> => {
  const result = await runner.query<SessionUserRow>(
    `SELECT id, email, display_name, role,
            COALESCE(tier, 'free') AS tier,
            COALESCE(mfa_enabled, FALSE) AS mfa_enabled,
            is_active, created_at, email_verified_at
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new UnauthorizedError('Session expired. Sign in again.', 'AUTH_SESSION_EXPIRED');
  }

  const user = result.rows[0]!;
  if (!user.is_active) {
    throw new ForbiddenError('Account is inactive', 'ACCOUNT_INACTIVE');
  }

  return toSafeUser(user);
};

const buildAccessToken = (user: SafeUser): string =>
  signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    tier: user.tier,
    mfaEnabled: user.mfaEnabled,
  });

const insertRefreshSession = async ({
  user,
  context,
  sessionId,
  sessionFamilyId,
  rotatedFromSessionId,
  carriedDeviceId,
  runner = pool,
}: {
  user: SafeUser;
  context?: AuthSessionContext;
  sessionId?: string;
  sessionFamilyId?: string;
  rotatedFromSessionId?: string | null;
  // Set when rotating an existing session (refreshAuthSession) — refresh
  // requests never resend a device fingerprint, so without this the device
  // link would silently drop on every single token refresh instead of only
  // being resolved once at initial sign-in.
  carriedDeviceId?: string | null;
  runner?: QueryRunner;
}): Promise<AuthResponse> => {
  const nextSessionId = sessionId ?? randomUUID();
  const nextFamilyId = sessionFamilyId ?? randomUUID();
  const refreshToken = signRefreshToken({
    sub: user.id,
    sessionId: nextSessionId,
    sessionFamilyId: nextFamilyId,
    type: 'refresh',
  });
  const expiresAt = getRefreshExpiryDate();

  // Resolves (creates or updates) the user_devices row for this login and
  // links it to the session being created — the upsert is idempotent and
  // independent of whatever transaction `runner` may be part of, so it always
  // goes through the plain pool rather than `runner`.
  let deviceId: string | null = carriedDeviceId ?? null;
  if (deviceId === null && context?.deviceFingerprint) {
    const device = await registerDevice(user.id, {
      deviceFingerprint: context.deviceFingerprint,
      deviceName: context.deviceName,
      deviceType: 'mobile',
      platform: context.platform,
    });
    deviceId = device.id;
  }

  await runner.query(
    `INSERT INTO auth_refresh_sessions (
       id,
       user_id,
       session_family_id,
       rotated_from_session_id,
       refresh_token_hash,
       expires_at,
       created_ip,
       created_user_agent,
       last_used_ip,
       last_used_user_agent,
       last_used_at,
       device_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $7, $8, NOW(), $9)`,
    [
      nextSessionId,
      user.id,
      nextFamilyId,
      rotatedFromSessionId ?? null,
      tokenHash(refreshToken),
      expiresAt.toISOString(),
      context?.requestIp ?? null,
      context?.userAgent ?? null,
      deviceId,
    ],
  );

  return {
    accessToken: buildAccessToken(user),
    refreshToken,
    user,
    requiresEmailVerification: false,
  };
};

const revokeRefreshSessionFamily = async (
  sessionFamilyId: string,
  runner: QueryRunner = pool,
): Promise<void> => {
  await runner.query(
    `UPDATE auth_refresh_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()),
         updated_at = NOW()
     WHERE session_family_id = $1
       AND revoked_at IS NULL`,
    [sessionFamilyId],
  );
};

export const issueAuthSession = async (
  user: SafeUser,
  context: AuthSessionContext = {},
): Promise<AuthResponse> => {
  const session = await insertRefreshSession({ user, context });

  // Fire-and-forget login notification email on new sign-in.
  // "New" = this IP or user-agent hasn't been seen for this user in the last 30 days.
  if (context.requestIp || context.userAgent) {
    pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM auth_refresh_sessions
       WHERE user_id = $1
         AND (created_ip = $2 OR created_user_agent = $3)
         AND created_at > NOW() - INTERVAL '30 days'
         AND id != (
           SELECT id FROM auth_refresh_sessions
           WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 1
         )`,
      [user.id, context.requestIp ?? null, context.userAgent ?? null],
    ).then(async (check) => {
      const isNewDevice = parseInt(check.rows[0]?.count ?? '0', 10) === 0;
      if (isNewDevice) {
        const { queueNewSignInEmail } = await import('../../infra/transactionalEmails.js');
        await queueNewSignInEmail({
          toEmail: user.email,
          displayName: user.displayName || user.email,
          userAgent: context.userAgent ?? null,
          ipAddress: context.requestIp ?? null,
        });
      }
    }).catch(() => { /* never block auth for email failures */ });
  }

  return session;
};

export const refreshAuthSession = async (
  rawRefreshToken: string,
  context: AuthSessionContext = {},
): Promise<AuthResponse> => {
  let claims;
  try {
    claims = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError('Session expired. Sign in again.', 'AUTH_SESSION_EXPIRED');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query<RefreshSessionRow>(
      `SELECT id, user_id, session_family_id, refresh_token_hash, revoked_at, expires_at, device_id
       FROM auth_refresh_sessions
       WHERE id = $1
       LIMIT 1
       FOR UPDATE`,
      [claims.sessionId],
    );

    if (sessionResult.rowCount === 0) {
      throw new UnauthorizedError('Session expired. Sign in again.', 'AUTH_SESSION_EXPIRED');
    }

    const session = sessionResult.rows[0]!;
    const refreshHash = tokenHash(rawRefreshToken);
    const isExpired = new Date(session.expires_at).getTime() <= Date.now();
    const isRevoked = Boolean(session.revoked_at);
    const hashMismatch = session.refresh_token_hash !== refreshHash;

    if (isExpired || isRevoked || hashMismatch) {
      await revokeRefreshSessionFamily(session.session_family_id, client);
      throw new UnauthorizedError('Session expired. Sign in again.', 'AUTH_SESSION_EXPIRED');
    }

    const user = await loadSessionUser(session.user_id, client);

    await client.query(
      `UPDATE auth_refresh_sessions
       SET revoked_at = NOW(),
           last_used_at = NOW(),
           last_used_ip = $2,
           last_used_user_agent = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [session.id, context.requestIp ?? null, context.userAgent ?? null],
    );

    const nextSession = await insertRefreshSession({
      user,
      context,
      sessionFamilyId: session.session_family_id,
      rotatedFromSessionId: session.id,
      carriedDeviceId: session.device_id,
      runner: client,
    });

    await client.query('COMMIT');
    return nextSession;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const revokeRefreshSession = async (rawRefreshToken: string): Promise<void> => {
  try {
    const claims = verifyRefreshToken(rawRefreshToken);
    await pool.query(
      `UPDATE auth_refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [claims.sessionId],
    );
  } catch {
    // Ignore invalid refresh tokens during logout.
  }
};

export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  await pool.query(
    `UPDATE auth_refresh_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()),
         updated_at = NOW()
     WHERE user_id = $1
       AND revoked_at IS NULL`,
    [userId],
  );
};

export const countActiveAuthSessions = async (): Promise<number> => {
  const result = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM auth_refresh_sessions
     WHERE revoked_at IS NULL
       AND expires_at > NOW()`,
  );

  return Number(result.rows[0]?.total || '0');
};
