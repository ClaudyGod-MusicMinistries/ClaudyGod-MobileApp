import { createHash, randomBytes } from 'crypto';
import { pool } from '../../db/pool';
import { BadRequestError } from '../../lib/errors';
import { createLogger } from '../../lib/logger';
import { queueOtpEmail } from '../../infra/transactionalEmails';

const logger = createLogger('emailOtp.service');

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS_PER_HOUR = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
export type EmailOtpPurpose = 'sign_in' | 'sign_up' | 'mfa_setup' | 'mfa_login' | 'mfa_action';

function generateOtp(): string {
  // 6-digit numeric code
  return String(Math.floor(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000))).padStart(6, '0');
}

function hashCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

export async function requestEmailOtp(email: string, purpose: EmailOtpPurpose = 'sign_in'): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  // Rate limit: max 5 OTPs per email per hour
  const recentCount = await pool.query<{ count: string; last_created_at: string | null }>(
    `SELECT COUNT(*) AS count, MAX(created_at) AS last_created_at FROM email_otps
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
  const lastCreatedAt = recentCount.rows[0]?.last_created_at;
  if (lastCreatedAt && Date.now() - new Date(lastCreatedAt).getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    throw new BadRequestError(
      `Wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code.`,
      'OTP_RESEND_COOLDOWN',
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

  await queueOtpEmail({ toEmail: normalizedEmail, code, expiresInMinutes: OTP_TTL_MINUTES, context: purpose });
}

export interface OtpVerifyResult {
  email: string;
  isNewUser: boolean;
}

export async function verifyEmailOtp(email: string, code: string, purpose: EmailOtpPurpose = 'sign_in'): Promise<OtpVerifyResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const codeHash = hashCode(code.trim());

  const result = await pool.query<{ id: string }>(
    `UPDATE email_otps SET used_at = NOW()
     WHERE id = (
       SELECT id FROM email_otps
       WHERE email = $1 AND purpose = $2 AND code_hash = $3
         AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id`,
    [normalizedEmail, purpose, codeHash],
  );

  if (!result.rows[0]) {
    throw new BadRequestError('Invalid or expired code. Request a new one.', 'OTP_INVALID');
  }

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
