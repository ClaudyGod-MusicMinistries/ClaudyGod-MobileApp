import { pool } from '../../db/pool';
import type { RegisterDeviceInput } from './devices.schema';

export interface UserDevice {
  id: string;
  deviceFingerprint: string;
  deviceName: string | null;
  deviceType: string;
  platform: string | null;
  appVersion: string | null;
  isTrusted: boolean;
  lastSeenAt: string;
  registeredAt: string;
}

interface DeviceRow {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  device_type: string;
  platform: string | null;
  app_version: string | null;
  is_trusted: boolean;
  last_seen_at: Date;
  registered_at: Date;
}

const rowToDevice = (row: DeviceRow): UserDevice => ({
  id: row.id,
  deviceFingerprint: row.device_fingerprint,
  deviceName: row.device_name,
  deviceType: row.device_type,
  platform: row.platform,
  appVersion: row.app_version,
  isTrusted: row.is_trusted,
  lastSeenAt: new Date(row.last_seen_at).toISOString(),
  registeredAt: new Date(row.registered_at).toISOString(),
});

export async function listUserDevices(userId: string): Promise<UserDevice[]> {
  const result = await pool.query<DeviceRow>(
    `SELECT id, device_fingerprint, device_name, device_type, platform, app_version,
            is_trusted, last_seen_at, registered_at
     FROM user_devices
     WHERE user_id = $1
       AND revoked_at IS NULL
     ORDER BY last_seen_at DESC`,
    [userId],
  );
  return result.rows.map(rowToDevice);
}

export async function registerDevice(
  userId: string,
  input: RegisterDeviceInput,
): Promise<UserDevice> {
  const result = await pool.query<DeviceRow>(
    `INSERT INTO user_devices (
       user_id, device_fingerprint, device_name, device_type, platform, app_version,
       push_token, last_seen_at, registered_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (user_id, device_fingerprint) DO UPDATE
     SET device_name  = COALESCE(EXCLUDED.device_name, user_devices.device_name),
         device_type  = EXCLUDED.device_type,
         platform     = COALESCE(EXCLUDED.platform, user_devices.platform),
         app_version  = COALESCE(EXCLUDED.app_version, user_devices.app_version),
         push_token   = COALESCE(EXCLUDED.push_token, user_devices.push_token),
         last_seen_at = NOW()
     RETURNING id, device_fingerprint, device_name, device_type, platform, app_version,
               is_trusted, last_seen_at, registered_at`,
    [
      userId,
      input.deviceFingerprint,
      input.deviceName ?? null,
      input.deviceType,
      input.platform ?? null,
      input.appVersion ?? null,
      input.pushToken ?? null,
    ],
  );

  const row = result.rows[0];
  if (!row) throw new Error('Failed to register device');
  return rowToDevice(row);
}

export async function revokeDevice(userId: string, deviceId: string): Promise<void> {
  await pool.query(
    `UPDATE user_devices
     SET revoked_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND revoked_at IS NULL`,
    [deviceId, userId],
  );
}
