import { randomBytes, createHash } from 'crypto';
import { verifySync } from 'otplib';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { createLogger } from '../../lib/logger';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../lib/errors';
import type { JwtClaims } from '../../utils/jwt';
import { requestEmailOtp, verifyEmailOtp } from './emailOtp.service';

const logger = createLogger('mfa.service');

// otplib v13 uses functional API — no singleton, options passed per-call.
// epochTolerance: 30 == ±1 TOTP time step (30 s), same as the old window: 1.
const VERIFY_OPTS = { epochTolerance: 30 } as const;

interface MfaSetupResult {
  delivery: 'email';
  maskedEmail: string;
  expiresInMinutes: number;
}

interface BackupCodesResult {
  codes: string[];
}

function generateBackupCodes(count: number): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(4).toString('hex').toUpperCase(),
  );
}

const maskEmail = (email: string): string => {
  const [local = '', domain = ''] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
};

export async function setupMfa(user: JwtClaims): Promise<MfaSetupResult> {
  const existing = await pool.query<{ id: string; is_verified: boolean }>(
    `SELECT id, is_verified FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'email' AND is_active = TRUE`,
    [user.sub],
  );

  if (existing.rows.length > 0 && existing.rows[0]!.is_verified) {
    throw new BadRequestError('MFA is already enabled and verified', 'MFA_ALREADY_ENABLED');
  }

  await pool.query(
    `INSERT INTO user_mfa_factors (user_id, factor_type, secret, is_verified, is_active)
     VALUES ($1, 'email', $2, FALSE, TRUE)
     ON CONFLICT (user_id, factor_type)
     DO UPDATE SET secret = $2, is_verified = FALSE, is_active = TRUE, updated_at = NOW()`,
    [user.sub, user.email.trim().toLowerCase()],
  );

  await requestEmailOtp(user.email, 'mfa_setup');
  return { delivery: 'email', maskedEmail: maskEmail(user.email), expiresInMinutes: 10 };
}

export async function verifyMfaSetup(user: JwtClaims, code: string): Promise<BackupCodesResult> {
  const row = await pool.query<{ id: string; secret: string }>(
    `SELECT id, secret FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'email' AND is_active = TRUE`,
    [user.sub],
  );

  if (!row.rows[0]) {
    throw new NotFoundError('No pending MFA setup found', 'MFA_NOT_FOUND');
  }

  const { id } = row.rows[0];
  await verifyEmailOtp(user.email, code, 'mfa_setup');

  const backupCodes = generateBackupCodes(env.MFA_BACKUP_CODES_COUNT);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE user_mfa_factors SET is_active = FALSE, updated_at = NOW()
                        WHERE user_id = $1 AND id <> $2`, [user.sub, id]);
    await client.query(`UPDATE user_mfa_factors SET is_verified = TRUE, updated_at = NOW() WHERE id = $1`, [id]);

    await client.query(
      `DELETE FROM user_backup_codes WHERE user_id = $1`,
      [user.sub],
    );

    for (const code of backupCodes) {
      const hash = createHash('sha256').update(code).digest('hex');
      await client.query(
        `INSERT INTO user_backup_codes (user_id, code_hash) VALUES ($1, $2)`,
        [user.sub, hash],
      );
    }

    await client.query(
      `UPDATE app_users SET mfa_enabled = TRUE, updated_at = NOW() WHERE id = $1`,
      [user.sub],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }

  logger.info('MFA email OTP verified and enabled', { userId: user.sub });
  return { codes: backupCodes };
}

export async function disableMfa(user: JwtClaims, code: string): Promise<void> {
  await verifyMfaActionCode(user, code);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE user_mfa_factors SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1`, [user.sub]);
    await client.query(`DELETE FROM user_backup_codes WHERE user_id = $1`, [user.sub]);
    await client.query(`UPDATE app_users SET mfa_enabled = FALSE, updated_at = NOW() WHERE id = $1`, [user.sub]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }

  logger.info('MFA disabled', { userId: user.sub });
}

export async function validateMfaCode(userId: string, code: string): Promise<boolean> {
  const row = await pool.query<{ secret: string }>(
    `SELECT secret FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'totp' AND is_verified = TRUE AND is_active = TRUE`,
    [userId],
  );

  if (row.rows[0]) {
    const isTotp = verifySync({ token: code, secret: row.rows[0].secret, ...VERIFY_OPTS }).valid;
    if (isTotp) return true;
  }

  const codeHash = createHash('sha256').update(code.toUpperCase()).digest('hex');
  const backup = await pool.query<{ id: string }>(
    `UPDATE user_backup_codes SET used_at = NOW()
     WHERE id = (
       SELECT id FROM user_backup_codes
       WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL
       ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
     ) RETURNING id`,
    [userId, codeHash],
  );

  if (backup.rows[0]) return true;

  return false;
}

export async function regenerateBackupCodes(user: JwtClaims, currentCode: string): Promise<BackupCodesResult> {
  await verifyMfaActionCode(user, currentCode);

  const backupCodes = generateBackupCodes(env.MFA_BACKUP_CODES_COUNT);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM user_backup_codes WHERE user_id = $1`, [user.sub]);
    for (const code of backupCodes) {
      const hash = createHash('sha256').update(code).digest('hex');
      await client.query(
        `INSERT INTO user_backup_codes (user_id, code_hash) VALUES ($1, $2)`,
        [user.sub, hash],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }

  return { codes: backupCodes };
}

export async function requestMfaActionCode(user: JwtClaims): Promise<MfaSetupResult> {
  const factor = await pool.query<{ factor_type: string }>(
    `SELECT factor_type FROM user_mfa_factors
     WHERE user_id = $1 AND is_verified = TRUE AND is_active = TRUE
     ORDER BY CASE WHEN factor_type = 'email' THEN 0 ELSE 1 END LIMIT 1`,
    [user.sub],
  );
  if (!factor.rows[0]) throw new NotFoundError('MFA is not enabled', 'MFA_NOT_ENABLED');
  if (factor.rows[0].factor_type !== 'email') {
    throw new BadRequestError('Use your existing authenticator or recovery code for this legacy MFA factor.', 'MFA_LEGACY_FACTOR');
  }
  await requestEmailOtp(user.email, 'mfa_action');
  return { delivery: 'email', maskedEmail: maskEmail(user.email), expiresInMinutes: 10 };
}

async function verifyMfaActionCode(user: JwtClaims, code: string): Promise<void> {
  const factor = await pool.query<{ factor_type: string }>(
    `SELECT factor_type FROM user_mfa_factors
     WHERE user_id = $1 AND is_verified = TRUE AND is_active = TRUE
     ORDER BY CASE WHEN factor_type = 'email' THEN 0 ELSE 1 END LIMIT 1`,
    [user.sub],
  );
  if (!factor.rows[0]) throw new NotFoundError('MFA is not enabled', 'MFA_NOT_ENABLED');
  if (factor.rows[0].factor_type === 'email' && code.trim().length === 6) {
    await verifyEmailOtp(user.email, code, 'mfa_action');
    return;
  }
  if (!(await validateMfaCode(user.sub, code))) {
    throw new UnauthorizedError('Invalid MFA or recovery code', 'MFA_INVALID_CODE');
  }
}
