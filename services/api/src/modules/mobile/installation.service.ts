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

type InstallationEventInput = {
  event: 'onboarding_completed' | 'playback_milestone'; idempotencyKey: string;
  contentId?: string; contentType?: string; title?: string; subtitle?: string;
  description?: string; duration?: string; imageUrl?: string; mediaUrl?: string; source?: string;
};

export async function recordInstallationActivation(installationId: string, input: InstallationEventInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const preference = await client.query<{ personalization_enabled: boolean }>(`SELECT personalization_enabled FROM mobile_installations WHERE id = $1 FOR UPDATE`, [installationId]);
    const mayPersonalize = preference.rows[0]?.personalization_enabled !== false;
    if (input.event === 'playback_milestone' && input.contentId && input.contentType && input.contentType !== 'ad' && input.title) {
      await client.query(
        `INSERT INTO mobile_installation_history
           (installation_id, content_id, content_type, title, subtitle, description, duration, image_url, media_url, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (installation_id, content_id) DO UPDATE SET
           content_type = EXCLUDED.content_type, title = EXCLUDED.title,
           subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
           duration = EXCLUDED.duration, image_url = EXCLUDED.image_url,
           media_url = EXCLUDED.media_url, source = EXCLUDED.source,
           play_count = mobile_installation_history.play_count + 1, last_played_at = NOW()`,
        [installationId, input.contentId, input.contentType, input.title, input.subtitle ?? null, input.description ?? null, input.duration ?? null, input.imageUrl ?? null, input.mediaUrl ?? null, input.source ?? null],
      );
    }
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

export async function getInstallationHistory(installationId: string, limit: number) {
  const result = await pool.query<{
    content_id: string; content_type: string; title: string; subtitle: string | null;
    description: string | null; duration: string | null; image_url: string | null;
    media_url: string | null; last_played_at: Date | string;
  }>(
    `SELECT content_id, content_type, title, subtitle, description, duration, image_url, media_url, last_played_at
       FROM mobile_installation_history
      WHERE installation_id = $1
      ORDER BY last_played_at DESC
      LIMIT $2`,
    [installationId, limit],
  );
  return { items: result.rows.map((row) => ({
    id: row.content_id, type: row.content_type, title: row.title,
    subtitle: row.subtitle ?? '', description: row.description ?? '', duration: row.duration ?? '',
    imageUrl: row.image_url ?? '', mediaUrl: row.media_url ?? undefined,
    createdAt: new Date(row.last_played_at).toISOString(),
  })) };
}

export async function clearInstallationHistory(installationId: string) {
  const result = await pool.query(`DELETE FROM mobile_installation_history WHERE installation_id = $1`, [installationId]);
  return { clearedHistoryItems: result.rowCount ?? 0 };
}

export async function getInstallationPreferences(installationId: string) {
  const result = await pool.query<{ personalization_enabled: boolean; notifications_enabled: boolean }>(`SELECT personalization_enabled, notifications_enabled FROM mobile_installations WHERE id = $1`, [installationId]);
  return { preferences: { personalizationEnabled: result.rows[0]?.personalization_enabled ?? true, notificationsEnabled: result.rows[0]?.notifications_enabled ?? false } };
}

export async function updateInstallationPreferences(installationId: string, input: { personalizationEnabled?: boolean; notificationsEnabled?: boolean }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ personalization_enabled: boolean; notifications_enabled: boolean }>(
      `UPDATE mobile_installations SET personalization_enabled = COALESCE($2, personalization_enabled), notifications_enabled = COALESCE($3, notifications_enabled), last_seen_at = NOW() WHERE id = $1 RETURNING personalization_enabled, notifications_enabled`,
      [installationId, input.personalizationEnabled ?? null, input.notificationsEnabled ?? null],
    );
    if (input.personalizationEnabled === false) {
      await client.query(`DELETE FROM mobile_installation_events WHERE installation_id = $1 AND content_id IS NOT NULL`, [installationId]);
    }
    if (input.notificationsEnabled === false) {
      await client.query(`DELETE FROM mobile_installation_push_tokens WHERE installation_id = $1`, [installationId]);
    }
    await client.query('COMMIT');
    return { preferences: { personalizationEnabled: result.rows[0]?.personalization_enabled ?? true, notificationsEnabled: result.rows[0]?.notifications_enabled ?? false } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveInstallationPushToken(installationId: string, input: { expoPushToken: string; deviceType?: string }) {
  await pool.query(
    `INSERT INTO mobile_installation_push_tokens (installation_id, expo_push_token, device_type)
     VALUES ($1,$2,$3) ON CONFLICT (expo_push_token) DO UPDATE SET installation_id = EXCLUDED.installation_id, device_type = EXCLUDED.device_type, updated_at = NOW()`,
    [installationId, input.expoPushToken, input.deviceType ?? null],
  );
  return { registered: true };
}

export async function removeInstallationPushToken(installationId: string, expoPushToken: string) {
  const result = await pool.query(`DELETE FROM mobile_installation_push_tokens WHERE installation_id = $1 AND expo_push_token = $2`, [installationId, expoPushToken]);
  return { removed: (result.rowCount ?? 0) > 0 };
}

export async function subscribeInstallationToLive(installationId: string, input: { channelId: string; label?: string }) {
  await pool.query(
    `INSERT INTO mobile_installation_live_subscriptions (installation_id, channel_id, label)
     VALUES ($1,$2,$3) ON CONFLICT (installation_id, channel_id) DO UPDATE SET label = EXCLUDED.label, updated_at = NOW()`,
    [installationId, input.channelId, input.label ?? null],
  );
  return { subscribed: true };
}

export async function resetInstallationRecommendations(installationId: string) {
  const result = await pool.query(
    `DELETE FROM mobile_installation_events WHERE installation_id = $1 AND content_id IS NOT NULL`,
    [installationId],
  );
  return { clearedPlayEvents: result.rowCount ?? 0 };
}
