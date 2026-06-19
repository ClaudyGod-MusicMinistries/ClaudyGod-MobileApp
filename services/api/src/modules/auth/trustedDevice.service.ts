import { createHash, randomBytes } from 'crypto';
import { pool } from '../../db/pool';
import { UnauthorizedError, NotFoundError } from '../../lib/errors';
import { createLogger } from '../../lib/logger';
import { registerDevice } from '../devices/devices.service';

const logger = createLogger('trustedDevice.service');

const TRUSTED_DEVICE_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface TrustedDeviceInfo {
  id: string;
  deviceLabel: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string;
}

export async function registerTrustedDevice(input: {
  userId: string;
  deviceLabel?: string;
  deviceFingerprint: string;
  platform: string;
}): Promise<{ token: string; expiresAt: Date }> {
  // Upsert into user_devices first to get a device row
  const device = await registerDevice(input.userId, {
    deviceFingerprint: input.deviceFingerprint,
    deviceType: input.platform === 'web' ? 'web' : 'mobile',
    platform: input.platform,
    deviceName: input.deviceLabel ?? undefined,
    appVersion: undefined,
    pushToken: undefined,
  });

  // Mark the device as trusted
  await pool.query(
    `UPDATE user_devices SET is_trusted = TRUE WHERE id = $1`,
    [device.id],
  );

  // Revoke any existing trusted device token for this device
  await pool.query(
    `UPDATE trusted_device_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND device_id = $2 AND revoked_at IS NULL`,
    [input.userId, device.id],
  );

  const rawToken = randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO trusted_device_tokens (user_id, device_id, token_hash, device_label, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.userId, device.id, hashToken(rawToken), input.deviceLabel ?? null, expiresAt.toISOString()],
  );

  logger.info('Trusted device registered', { userId: input.userId, deviceId: device.id });
  return { token: rawToken, expiresAt };
}

export async function verifyTrustedDeviceToken(rawToken: string): Promise<string> {
  const tokenHash = hashToken(rawToken.trim());

  const result = await pool.query<{
    id: string; user_id: string; expires_at: string; revoked_at: string | null;
  }>(
    `SELECT id, user_id, expires_at, revoked_at
     FROM trusted_device_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) throw new UnauthorizedError('Trusted device token invalid', 'TRUSTED_DEVICE_INVALID');
  if (row.revoked_at) throw new UnauthorizedError('Trusted device token revoked', 'TRUSTED_DEVICE_REVOKED');
  if (new Date(row.expires_at) < new Date()) throw new UnauthorizedError('Trusted device token expired', 'TRUSTED_DEVICE_EXPIRED');

  // Update last used
  await pool.query(
    `UPDATE trusted_device_tokens SET last_used_at = NOW() WHERE id = $1`,
    [row.id],
  );

  return row.user_id;
}

export async function listTrustedDevices(userId: string): Promise<TrustedDeviceInfo[]> {
  const result = await pool.query<{
    id: string; device_label: string | null; last_used_at: string | null;
    created_at: string; expires_at: string;
  }>(
    `SELECT id, device_label, last_used_at, created_at, expires_at
     FROM trusted_device_tokens
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY COALESCE(last_used_at, created_at) DESC`,
    [userId],
  );
  return result.rows.map(r => ({
    id: r.id,
    deviceLabel: r.device_label,
    lastUsedAt: r.last_used_at,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  }));
}

export async function revokeTrustedDevice(userId: string, tokenId: string): Promise<void> {
  const result = await pool.query(
    `UPDATE trusted_device_tokens
     SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [tokenId, userId],
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new NotFoundError('Trusted device not found', 'TRUSTED_DEVICE_NOT_FOUND');
  }
  logger.info('Trusted device revoked', { userId, tokenId });
}

export async function revokeAllTrustedDevices(userId: string): Promise<void> {
  await pool.query(
    `UPDATE trusted_device_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
