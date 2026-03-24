import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import type { AuthResponse, SafeUser, UserRole } from './auth.types';

interface QueryRunner {
  query: PoolClient['query'];
}

interface SessionUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
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
}

export interface AuthSessionContext {
  requestIp?: string;
  userAgent?: string;
}

const toIsoDate = (value: string | Date): string => new Date(value).toISOString();
const toIsoDateOrNull = (value: string | Date | null): string | null =>
  value ? toIsoDate(value) : null;

const toSafeUser = (row: SessionUserRow): SafeUser => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  createdAt: toIsoDate(row.created_at),
  emailVerifiedAt: toIsoDateOrNull(row.email_verified_at),
});

const tokenHash = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const getRefreshExpiryDate = (): Date =>
  new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

const loadSessionUser = async (
  userId: string,
  runner: QueryRunner = pool,
): Promise<SafeUser> => {
  const result = await runner.query<SessionUserRow>(
    `SELECT id, email, display_name, role, is_active, created_at, email_verified_at
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(401, 'Session expired. Sign in again.');
  }

  const user = result.rows[0]!;
  if (!user.is_active) {
    throw new HttpError(403, 'Account is inactive');
  }

  return toSafeUser(user);
};

const buildAccessToken = (user: SafeUser): string =>
  signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  });

const insertRefreshSession = async ({
  user,
  context,
  sessionId,
  sessionFamilyId,
  rotatedFromSessionId,
  runner = pool,
}: {
  user: SafeUser;
  context?: AuthSessionContext;
  sessionId?: string;
  sessionFamilyId?: string;
  rotatedFromSessionId?: string | null;
  runner?: QueryRunner;
}): Promise<AuthResponse> => {
  const nextSessionId = sessionId ?? crypto.randomUUID();
  const nextFamilyId = sessionFamilyId ?? crypto.randomUUID();
  const refreshToken = signRefreshToken({
    sub: user.id,
    sessionId: nextSessionId,
    sessionFamilyId: nextFamilyId,
    type: 'refresh',
  });
  const expiresAt = getRefreshExpiryDate();

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
       last_used_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $7, $8, NOW())`,
    [
      nextSessionId,
      user.id,
      nextFamilyId,
      rotatedFromSessionId ?? null,
      tokenHash(refreshToken),
      expiresAt.toISOString(),
      context?.requestIp ?? null,
      context?.userAgent ?? null,
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
): Promise<AuthResponse> =>
  insertRefreshSession({
    user,
    context,
  });

export const refreshAuthSession = async (
  rawRefreshToken: string,
  context: AuthSessionContext = {},
): Promise<AuthResponse> => {
  let claims;
  try {
    claims = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new HttpError(401, 'Session expired. Sign in again.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query<RefreshSessionRow>(
      `SELECT id, user_id, session_family_id, refresh_token_hash, revoked_at, expires_at
       FROM auth_refresh_sessions
       WHERE id = $1
       LIMIT 1
       FOR UPDATE`,
      [claims.sessionId],
    );

    if (sessionResult.rowCount === 0) {
      throw new HttpError(401, 'Session expired. Sign in again.');
    }

    const session = sessionResult.rows[0]!;
    const refreshHash = tokenHash(rawRefreshToken);
    const isExpired = new Date(session.expires_at).getTime() <= Date.now();
    const isRevoked = Boolean(session.revoked_at);
    const hashMismatch = session.refresh_token_hash !== refreshHash;

    if (isExpired || isRevoked || hashMismatch) {
      await revokeRefreshSessionFamily(session.session_family_id, client);
      throw new HttpError(401, 'Session expired. Sign in again.');
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
