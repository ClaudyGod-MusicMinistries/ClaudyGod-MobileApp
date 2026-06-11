import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';
import { UnauthorizedError } from '../../lib/errors.js';

const logger = createLogger('accountSecurity.service');

export type SecurityEvent =
  | 'login_success'
  | 'login_failed'
  | 'login_mfa_failed'
  | 'login_blocked'
  | 'logout'
  | 'password_changed'
  | 'email_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'oauth_linked'
  | 'biometric_registered'
  | 'biometric_revoked'
  | 'account_locked'
  | 'account_unlocked'
  | 'token_refresh'
  | 'session_revoked'
  | 'suspicious_activity';

export async function recordSecurityEvent(
  userId: string | null,
  event: SecurityEvent,
  context: {
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO security_audit_log (user_id, event, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        event,
        context.ip ?? null,
        context.userAgent ?? null,
        JSON.stringify(context.metadata ?? {}),
      ],
    );
  } catch (err) {
    logger.warn('Failed to write security audit log', { err, event, userId });
  }
}

export async function recordFailedLogin(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<{ isLocked: boolean; attemptsRemaining: number }> {
  const maxAttempts = env.ACCOUNT_LOCKOUT_ATTEMPTS;
  const lockDurationMinutes = env.ACCOUNT_LOCKOUT_DURATION_MINUTES;

  await pool.query(
    `INSERT INTO user_account_security (user_id, failed_login_attempts, last_failed_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET failed_login_attempts = user_account_security.failed_login_attempts + 1,
           last_failed_at = NOW()`,
    [userId],
  );

  const row = await pool.query<{ failed_login_attempts: number }>(
    `SELECT failed_login_attempts FROM user_account_security WHERE user_id = $1`,
    [userId],
  );

  const attempts = row.rows[0]?.failed_login_attempts ?? 1;

  if (attempts >= maxAttempts) {
    await pool.query(
      `UPDATE user_account_security
       SET locked_until = NOW() + ($1 * INTERVAL '1 minute')
       WHERE user_id = $2`,
      [lockDurationMinutes, userId],
    );

    await recordSecurityEvent(userId, 'account_locked', {
      ip,
      userAgent,
      metadata: { attempts, lockDurationMinutes },
    });

    logger.warn('Account locked due to failed login attempts', { userId, attempts });
  } else {
    await recordSecurityEvent(userId, 'login_failed', { ip, userAgent, metadata: { attempts } });
  }

  return {
    isLocked: attempts >= maxAttempts,
    attemptsRemaining: Math.max(0, maxAttempts - attempts),
  };
}

export async function checkAccountLocked(userId: string): Promise<void> {
  const row = await pool.query<{ locked_until: Date | null }>(
    `SELECT locked_until FROM user_account_security WHERE user_id = $1`,
    [userId],
  );

  if (!row.rows[0]) return;

  const lockedUntil = row.rows[0].locked_until;
  if (lockedUntil && new Date(lockedUntil) > new Date()) {
    const secondsLeft = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000);
    throw new UnauthorizedError(
      `Account temporarily locked. Try again in ${Math.ceil(secondsLeft / 60)} minutes.`,
      'ACCOUNT_LOCKED',
    );
  }
}

export async function clearFailedLogins(userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_account_security
     SET failed_login_attempts = 0, locked_until = NULL, last_failed_at = NULL
     WHERE user_id = $1`,
    [userId],
  );
}

export async function recordPasswordChange(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO user_account_security (user_id, last_password_change_at)
     VALUES ($1, NOW())
     ON CONFLICT (user_id) DO UPDATE SET last_password_change_at = NOW()`,
    [userId],
  );
  await recordSecurityEvent(userId, 'password_changed', { ip, userAgent });
}

export async function getSecuritySummary(userId: string): Promise<{
  failedAttempts: number;
  lockedUntil: string | null;
  lastPasswordChangeAt: string | null;
  activeSessions: number;
  mfaEnabled: boolean;
  recentEvents: Array<{ event: string; ip: string | null; createdAt: string }>;
}> {
  const [secRow, sessionRow, mfaRow, eventsRow] = await Promise.all([
    pool.query<{ failed_login_attempts: number; locked_until: Date | null; last_password_change_at: Date | null }>(
      `SELECT failed_login_attempts, locked_until, last_password_change_at
       FROM user_account_security WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM auth_refresh_sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [userId],
    ),
    pool.query<{ mfa_enabled: boolean }>(
      `SELECT mfa_enabled FROM app_users WHERE id = $1`,
      [userId],
    ),
    pool.query<{ event: string; ip_address: string | null; created_at: Date }>(
      `SELECT event, ip_address, created_at FROM security_audit_log
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId],
    ),
  ]);

  const sec = secRow.rows[0];
  return {
    failedAttempts: sec?.failed_login_attempts ?? 0,
    lockedUntil: sec?.locked_until ? new Date(sec.locked_until).toISOString() : null,
    lastPasswordChangeAt: sec?.last_password_change_at
      ? new Date(sec.last_password_change_at).toISOString()
      : null,
    activeSessions: Number(sessionRow.rows[0]?.count ?? 0),
    mfaEnabled: mfaRow.rows[0]?.mfa_enabled ?? false,
    recentEvents: eventsRow.rows.map((r) => ({
      event: r.event,
      ip: r.ip_address,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
}

export async function revokeAllSessions(userId: string, except?: string): Promise<number> {
  const result = await pool.query(
    `UPDATE auth_refresh_sessions
     SET revoked_at = NOW()
     WHERE user_id = $1
       AND revoked_at IS NULL
       ${except ? 'AND session_id != $2' : ''}`,
    except ? [userId, except] : [userId],
  );
  await recordSecurityEvent(userId, 'session_revoked', { metadata: { revokedCount: result.rowCount } });
  return result.rowCount ?? 0;
}
