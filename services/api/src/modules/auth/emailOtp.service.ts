import { createHash, randomBytes } from 'crypto';
import { pool } from '../../db/pool';
import { BadRequestError } from '../../lib/errors';
import { createLogger } from '../../lib/logger';
import { queueOtpEmail } from '../../infra/transactionalEmails';

const logger = createLogger('emailOtp.service');

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS_PER_HOUR = 5;

function generateOtp(): string {
  // 6-digit numeric code
  return String(Math.floor(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000))).padStart(6, '0');
}

function hashCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

export async function requestEmailOtp(email: string, purpose: 'sign_in' | 'sign_up' = 'sign_in'): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  // Rate limit: max 5 OTPs per email per hour
  const recentCount = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM email_otps
     WHERE email = $1 AND purpose = $2
       AND created_at > NOW() - INTERVAL '1 hour'`,
    [normalizedEmail, purpose],
  );
  if (parseInt(recentCount.rows[0]?.count ?? '0', 10) >= OTP_MAX_ATTEMPTS_PER_HOUR) {
    throw new BadRequestError(
      'Too many code requests. Wait a moment before requesting another.',
      'OTP_RATE_LIMITED',
    );
  }

  // Invalidate any previous pending OTP for this email+purpose
  await pool.query(
    `UPDATE email_otps SET used_at = NOW()
     WHERE email = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW()`,
    [normalizedEmail, purpose],
  );

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO email_otps (email, code_hash, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [normalizedEmail, hashCode(code), purpose, expiresAt.toISOString()],
  );

  logger.info('Email OTP requested', { email: normalizedEmail, purpose });

  await queueOtpEmail({ toEmail: normalizedEmail, code, expiresInMinutes: OTP_TTL_MINUTES });
}

export interface OtpVerifyResult {
  email: string;
  isNewUser: boolean;
}

export async function verifyEmailOtp(email: string, code: string, purpose: 'sign_in' | 'sign_up' = 'sign_in'): Promise<OtpVerifyResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const codeHash = hashCode(code.trim());

  const result = await pool.query<{ id: string; expires_at: string }>(
    `SELECT id, expires_at FROM email_otps
     WHERE email = $1 AND purpose = $2 AND code_hash = $3 AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, purpose, codeHash],
  );

  if (!result.rows[0]) {
    throw new BadRequestError('Invalid or expired code. Request a new one.', 'OTP_INVALID');
  }

  const row = result.rows[0];
  if (new Date(row.expires_at) < new Date()) {
    throw new BadRequestError('This code has expired. Request a new one.', 'OTP_EXPIRED');
  }

  // Mark as used
  await pool.query(`UPDATE email_otps SET used_at = NOW() WHERE id = $1`, [row.id]);

  // Check if user already exists
  const userRow = await pool.query<{ id: string }>(
    `SELECT id FROM app_users WHERE email = $1 LIMIT 1`,
    [normalizedEmail],
  );
  const isNewUser = !userRow.rows[0];

  if (isNewUser && purpose === 'sign_in') {
    // Auto-create account for email-only sign-in
    const displayName = normalizedEmail.split('@')[0]!;
    await pool.query(
      `INSERT INTO app_users (email, display_name, password_hash, email_verified_at, role)
       VALUES ($1, $2, NULL, NOW(), 'CLIENT')
       ON CONFLICT (email) DO NOTHING`,
      [normalizedEmail, displayName],
    );
  }

  if (!isNewUser && !userRow.rows[0] && purpose === 'sign_up') {
    // If sign_up but user exists, that's fine — treat as sign in
  }

  logger.info('Email OTP verified', { email: normalizedEmail, isNewUser });
  return { email: normalizedEmail, isNewUser };
}

export const OTP_TTL_MINUTES_EXPORT = OTP_TTL_MINUTES;
