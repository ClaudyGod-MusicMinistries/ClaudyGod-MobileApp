import { createHash, randomBytes } from 'node:crypto';
import { pool } from '../../db/pool';
import { ConflictError, UnauthorizedError } from '../../lib/errors';

export type MobileInstallation = {
  id: string;
  platform: string;
  status: 'active' | 'revoked';
  activatedAt: string | null;
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const createToken = () => randomBytes(40).toString('base64url');

export async function registerInstallation(input: { platform: string; appVersion?: string }) {
  const token = createToken();
  const tokenHash = hashToken(token);
  const result = await pool.query<{ id: string; platform: string; status: 'active' | 'revoked'; activated_at: Date | string | null }>(
    `INSERT INTO mobile_installations (token_hash, platform, app_version)
     VALUES ($1, $2, $3)
     RETURNING id, platform, status, activated_at`,
    [tokenHash, input.platform, input.appVersion ?? null],
  );
  const row = result.rows[0];
  if (!row) throw new ConflictError('Installation registration failed', 'INSTALLATION_REGISTRATION_FAILED');
  return {
    installation: { id: row.id, platform: row.platform, status: row.status, activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null },
    credential: token,
  };
}

export async function resolveInstallationCredential(token: string): Promise<MobileInstallation> {
  const result = await pool.query<{ id: string; platform: string; status: 'active' | 'revoked'; activated_at: Date | string | null }>(
    `UPDATE mobile_installations
        SET last_seen_at = NOW()
      WHERE token_hash = $1 AND status = 'active'
      RETURNING id, platform, status, activated_at`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row) throw new UnauthorizedError('Invalid installation credential', 'INSTALLATION_CREDENTIAL_INVALID');
  return { id: row.id, platform: row.platform, status: row.status, activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null };
}

export async function recordInstallationActivation(installationId: string, input: { event: 'onboarding_completed' | 'playback_milestone'; idempotencyKey: string; contentId?: string; contentType?: string; source?: string }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const preference = await client.query<{ personalization_enabled: boolean }>(`SELECT personalization_enabled FROM mobile_installations WHERE id = $1 FOR UPDATE`, [installationId]);
    const mayPersonalize = preference.rows[0]?.personalization_enabled !== false;
    const inserted = await client.query(
      `INSERT INTO mobile_installation_events (installation_id, event_type, idempotency_key, content_id, content_type, source)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (installation_id, idempotency_key) DO NOTHING RETURNING id`,
      [installationId, input.event, mayPersonalize ? input.idempotencyKey : 'activation:first-play', mayPersonalize ? input.contentId ?? null : null, mayPersonalize ? input.contentType ?? null : null, mayPersonalize ? input.source ?? null : null],
    );
    if ((inserted.rowCount ?? 0) === 0) {
      await client.query('COMMIT');
      return { recorded: false, activated: false };
    }
    const activated = input.event === 'playback_milestone';
    if (activated) {
      await client.query(`UPDATE mobile_installations SET activated_at = COALESCE(activated_at, NOW()) WHERE id = $1`, [installationId]);
      const attribution = await client.query<{ referral_id: string }>(
        `UPDATE mobile_referral_attributions
            SET status = 'activated', activated_at = COALESCE(activated_at, NOW())
          WHERE joined_device_id = $1 AND status = 'attributed'
          RETURNING referral_id`,
        [installationId],
      );
      if (attribution.rows[0]) {
        await client.query(`UPDATE mobile_referrals SET joined_count = joined_count + 1, updated_at = NOW() WHERE id = $1`, [attribution.rows[0].referral_id]);
      }
    }
    await client.query('COMMIT');
    return { recorded: true, activated };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getInstallationPreferences(installationId: string) {
  const result = await pool.query<{ personalization_enabled: boolean }>(`SELECT personalization_enabled FROM mobile_installations WHERE id = $1`, [installationId]);
  return { preferences: { personalizationEnabled: result.rows[0]?.personalization_enabled ?? true } };
}

export async function updateInstallationPreferences(installationId: string, input: { personalizationEnabled: boolean }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ personalization_enabled: boolean }>(
      `UPDATE mobile_installations SET personalization_enabled = $2, last_seen_at = NOW() WHERE id = $1 RETURNING personalization_enabled`,
      [installationId, input.personalizationEnabled],
    );
    if (!input.personalizationEnabled) {
      await client.query(`DELETE FROM mobile_installation_events WHERE installation_id = $1 AND content_id IS NOT NULL`, [installationId]);
    }
    await client.query('COMMIT');
    return { preferences: { personalizationEnabled: result.rows[0]?.personalization_enabled ?? input.personalizationEnabled } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function resetInstallationRecommendations(installationId: string) {
  const result = await pool.query(
    `DELETE FROM mobile_installation_events WHERE installation_id = $1 AND content_id IS NOT NULL`,
    [installationId],
  );
  return { clearedPlayEvents: result.rowCount ?? 0 };
}
