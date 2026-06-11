import { randomBytes, createHash } from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authenticator } = require('otplib') as {
  authenticator: {
    options: Record<string, unknown>;
    generateSecret(): string;
    keyuri(account: string, service: string, secret: string): string;
    verify(opts: { token: string; secret: string }): boolean;
  }
};
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import type { JwtClaims } from '../../utils/jwt.js';

const logger = createLogger('mfa.service');

authenticator.options = {
  issuer: env.MFA_ISSUER,
  window: 1,
};

interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

interface BackupCodesResult {
  codes: string[];
}

function generateBackupCodes(count: number): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(4).toString('hex').toUpperCase(),
  );
}

export async function setupMfa(user: JwtClaims): Promise<MfaSetupResult> {
  const existing = await pool.query<{ id: string; is_verified: boolean }>(
    `SELECT id, is_verified FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'totp' AND is_active = TRUE`,
    [user.sub],
  );

  if (existing.rows.length > 0 && existing.rows[0]!.is_verified) {
    throw new BadRequestError('MFA is already enabled and verified', 'MFA_ALREADY_ENABLED');
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, env.MFA_ISSUER, secret);

  let qrDataUrl = '';
  try {
    const { default: QRCode } = await import('qrcode');
    qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  } catch {
    logger.warn('qrcode package not available, skipping QR data URL generation');
  }

  await pool.query(
    `INSERT INTO user_mfa_factors (user_id, factor_type, secret, is_verified, is_active)
     VALUES ($1, 'totp', $2, FALSE, TRUE)
     ON CONFLICT (user_id, factor_type)
     DO UPDATE SET secret = $2, is_verified = FALSE, updated_at = NOW()`,
    [user.sub, secret],
  );

  return { secret, otpauthUrl, qrDataUrl };
}

export async function verifyMfaSetup(user: JwtClaims, code: string): Promise<BackupCodesResult> {
  const row = await pool.query<{ id: string; secret: string }>(
    `SELECT id, secret FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'totp' AND is_active = TRUE`,
    [user.sub],
  );

  if (!row.rows[0]) {
    throw new NotFoundError('No pending MFA setup found', 'MFA_NOT_FOUND');
  }

  const { id, secret } = row.rows[0];
  const isValid = authenticator.verify({ token: code, secret });

  if (!isValid) {
    throw new BadRequestError('Invalid TOTP code', 'MFA_INVALID_CODE');
  }

  const backupCodes = generateBackupCodes(env.MFA_BACKUP_CODES_COUNT);

  await pool.query('BEGIN');
  try {
    await pool.query(
      `UPDATE user_mfa_factors SET is_verified = TRUE, updated_at = NOW() WHERE id = $1`,
      [id],
    );

    await pool.query(
      `DELETE FROM user_backup_codes WHERE user_id = $1`,
      [user.sub],
    );

    for (const code of backupCodes) {
      const hash = createHash('sha256').update(code).digest('hex');
      await pool.query(
        `INSERT INTO user_backup_codes (user_id, code_hash) VALUES ($1, $2)`,
        [user.sub, hash],
      );
    }

    await pool.query(
      `UPDATE app_users SET mfa_enabled = TRUE, updated_at = NOW() WHERE id = $1`,
      [user.sub],
    );

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  logger.info('MFA TOTP verified and enabled', { userId: user.sub });
  return { codes: backupCodes };
}

export async function disableMfa(user: JwtClaims, code: string): Promise<void> {
  const row = await pool.query<{ id: string; secret: string }>(
    `SELECT id, secret FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'totp' AND is_verified = TRUE AND is_active = TRUE`,
    [user.sub],
  );

  if (!row.rows[0]) {
    throw new NotFoundError('MFA is not enabled', 'MFA_NOT_ENABLED');
  }

  const { id, secret } = row.rows[0];
  const isValid = authenticator.verify({ token: code, secret });

  if (!isValid) {
    throw new BadRequestError('Invalid TOTP code', 'MFA_INVALID_CODE');
  }

  await pool.query('BEGIN');
  try {
    await pool.query(`UPDATE user_mfa_factors SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    await pool.query(`DELETE FROM user_backup_codes WHERE user_id = $1`, [user.sub]);
    await pool.query(`UPDATE app_users SET mfa_enabled = FALSE, updated_at = NOW() WHERE id = $1`, [user.sub]);
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  logger.info('MFA disabled', { userId: user.sub });
}

export async function validateMfaCode(userId: string, code: string): Promise<boolean> {
  const row = await pool.query<{ secret: string }>(
    `SELECT secret FROM user_mfa_factors
     WHERE user_id = $1 AND factor_type = 'totp' AND is_verified = TRUE AND is_active = TRUE`,
    [userId],
  );

  if (!row.rows[0]) return false;

  const isTotp = authenticator.verify({ token: code, secret: row.rows[0].secret });
  if (isTotp) return true;

  const codeHash = createHash('sha256').update(code.toUpperCase()).digest('hex');
  const backup = await pool.query<{ id: string }>(
    `SELECT id FROM user_backup_codes
     WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`,
    [userId, codeHash],
  );

  if (backup.rows[0]) {
    await pool.query(
      `UPDATE user_backup_codes SET used_at = NOW() WHERE id = $1`,
      [backup.rows[0].id],
    );
    return true;
  }

  return false;
}

export async function regenerateBackupCodes(user: JwtClaims, currentCode: string): Promise<BackupCodesResult> {
  const valid = await validateMfaCode(user.sub, currentCode);
  if (!valid) {
    throw new UnauthorizedError('Invalid MFA code', 'MFA_INVALID_CODE');
  }

  const backupCodes = generateBackupCodes(env.MFA_BACKUP_CODES_COUNT);

  await pool.query('BEGIN');
  try {
    await pool.query(`DELETE FROM user_backup_codes WHERE user_id = $1`, [user.sub]);
    for (const code of backupCodes) {
      const hash = createHash('sha256').update(code).digest('hex');
      await pool.query(
        `INSERT INTO user_backup_codes (user_id, code_hash) VALUES ($1, $2)`,
        [user.sub, hash],
      );
    }
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  return { codes: backupCodes };
}
