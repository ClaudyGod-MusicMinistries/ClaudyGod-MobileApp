import { createHash, randomBytes, createVerify } from 'crypto';
import { pool } from '../../db/pool';
import { createLogger } from '../../lib/logger';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../lib/errors';
import { issueAuthSession, type AuthSessionContext } from './authSession.service';
import type { AuthResponse, SafeUser, UserRole, UserTier } from './auth.types';

const logger = createLogger('biometric.service');

const CHALLENGE_TTL_SECONDS = 120;

interface BiometricChallenge {
  challengeId: string;
  challenge: string;
  expiresAt: number;
}

export async function registerBiometric(
  userId: string,
  deviceId: string,
  publicKey: string,
  algorithm: string,
  deviceLabel?: string,
): Promise<{ credentialId: string }> {
  const allowed = ['EC', 'RSA'];
  if (!allowed.some((a) => algorithm.toUpperCase().startsWith(a))) {
    throw new BadRequestError('Unsupported key algorithm. Use EC or RSA.', 'BIOMETRIC_INVALID_ALGORITHM');
  }

  if (!publicKey.match(/^[A-Za-z0-9+/=\-_]+$/)) {
    throw new BadRequestError('Invalid public key format', 'BIOMETRIC_INVALID_KEY');
  }

  const keyHash = createHash('sha256').update(publicKey).digest('hex');

  const result = await pool.query<{ id: string }>(
    `INSERT INTO user_biometric_credentials
       (user_id, device_id, public_key, key_hash, algorithm, device_label)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, device_id)
     DO UPDATE SET public_key = $3, key_hash = $4, algorithm = $5,
                   device_label = COALESCE($6, user_biometric_credentials.device_label),
                   updated_at = NOW()
     RETURNING id`,
    [userId, deviceId, publicKey, keyHash, algorithm.toUpperCase(), deviceLabel ?? null],
  );

  logger.info('Biometric credential registered', { userId, deviceId });
  return { credentialId: result.rows[0]!.id };
}

export async function createBiometricChallenge(
  userId: string,
  deviceId: string,
): Promise<BiometricChallenge> {
  const cred = await pool.query<{ id: string }>(
    `SELECT id FROM user_biometric_credentials
     WHERE user_id = $1 AND device_id = $2 AND revoked_at IS NULL`,
    [userId, deviceId],
  );

  if (!cred.rows[0]) {
    throw new NotFoundError('No biometric credential for this device', 'BIOMETRIC_NOT_REGISTERED');
  }

  const challenge = randomBytes(32).toString('base64url');
  const challengeId = randomBytes(16).toString('hex');
  const expiresAt = Date.now() + CHALLENGE_TTL_SECONDS * 1000;

  await pool.query(
    `INSERT INTO biometric_challenges (id, user_id, device_id, challenge, expires_at)
     VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))`,
    [challengeId, userId, deviceId, challenge, expiresAt],
  );

  return { challengeId, challenge, expiresAt };
}

export async function verifyBiometricSignature(
  challengeId: string,
  signature: string,
  context?: AuthSessionContext,
): Promise<AuthResponse> {
  const row = await pool.query<{
    user_id: string; device_id: string; challenge: string; expires_at: Date;
    public_key: string; algorithm: string;
    user_email: string; user_display_name: string; user_role: string;
    user_tier: string; user_mfa_enabled: boolean; user_email_verified_at: string | null;
    user_is_active: boolean;
  }>(
    `SELECT bc.user_id, bc.device_id, bc.challenge, bc.expires_at,
            ubc.public_key, ubc.algorithm,
            u.email AS user_email, u.display_name AS user_display_name,
            u.role AS user_role, u.tier AS user_tier,
            u.mfa_enabled AS user_mfa_enabled,
            u.email_verified_at AS user_email_verified_at,
            u.is_active AS user_is_active
     FROM biometric_challenges bc
     INNER JOIN user_biometric_credentials ubc
       ON ubc.user_id = bc.user_id AND ubc.device_id = bc.device_id AND ubc.revoked_at IS NULL
     INNER JOIN app_users u ON u.id = bc.user_id
     WHERE bc.id = $1 AND bc.used_at IS NULL`,
    [challengeId],
  );

  if (!row.rows[0]) {
    throw new UnauthorizedError('Invalid or expired biometric challenge', 'BIOMETRIC_CHALLENGE_INVALID');
  }

  const data = row.rows[0];

  if (new Date(data.expires_at) < new Date()) {
    await pool.query(`DELETE FROM biometric_challenges WHERE id = $1`, [challengeId]);
    throw new UnauthorizedError('Biometric challenge has expired', 'BIOMETRIC_CHALLENGE_EXPIRED');
  }

  if (!data.user_is_active) {
    throw new UnauthorizedError('Account is disabled', 'ACCOUNT_DISABLED');
  }

  const isValid = verifySignature(data.challenge, signature, data.public_key, data.algorithm);
  if (!isValid) {
    throw new UnauthorizedError('Biometric signature verification failed', 'BIOMETRIC_INVALID_SIGNATURE');
  }

  await pool.query(
    `UPDATE biometric_challenges SET used_at = NOW() WHERE id = $1`,
    [challengeId],
  );

  await pool.query(
    `UPDATE user_biometric_credentials SET last_used_at = NOW() WHERE user_id = $1 AND device_id = $2`,
    [data.user_id, data.device_id],
  );

  await pool.query(
    `UPDATE app_users SET last_login_at = NOW() WHERE id = $1`,
    [data.user_id],
  );

  const safeUser: SafeUser = {
    id: data.user_id,
    email: data.user_email,
    displayName: data.user_display_name,
    role: data.user_role as UserRole,
    tier: (data.user_tier ?? 'free') as UserTier,
    mfaEnabled: data.user_mfa_enabled,
    createdAt: new Date().toISOString(),
    emailVerifiedAt: data.user_email_verified_at,
  };

  // The biometric challenge is already scoped to a specific device_id (the
  // same identifier user_biometric_credentials keys on), so it doubles as
  // the device fingerprint for linking this session to a user_devices row.
  const session = await issueAuthSession(safeUser, {
    ...context,
    deviceFingerprint: context?.deviceFingerprint ?? data.device_id,
    userAgent: context?.userAgent ?? 'biometric',
  });

  logger.info('Biometric authentication successful', { userId: data.user_id, deviceId: data.device_id });

  return session;
}

export async function revokeBiometric(userId: string, deviceId: string): Promise<void> {
  const result = await pool.query(
    `UPDATE user_biometric_credentials SET revoked_at = NOW()
     WHERE user_id = $1 AND device_id = $2 AND revoked_at IS NULL`,
    [userId, deviceId],
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('No active biometric credential for this device', 'BIOMETRIC_NOT_FOUND');
  }

  logger.info('Biometric credential revoked', { userId, deviceId });
}

function verifySignature(challenge: string, signature: string, publicKeyPem: string, algorithm: string): boolean {
  try {
    const normalizedKey = publicKeyPem.includes('BEGIN')
      ? publicKeyPem
      : `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`;

    const algo = algorithm.startsWith('EC') ? 'SHA256' : 'SHA256';
    const verify = createVerify(algo);
    verify.update(challenge);
    return verify.verify(normalizedKey, signature, 'base64');
  } catch (err) {
    logger.warn('Biometric signature verification error', { err });
    return false;
  }
}
