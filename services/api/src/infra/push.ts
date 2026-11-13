import { pool } from '../db/pool';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushResponseItem {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

interface ExpoPushBatchResponse {
  data?: ExpoPushResponseItem[];
}

export interface PushDeliverySummary {
  attempted: number;
  accepted: number;
  invalidTokens: number;
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

const isExpoPushToken = (value: string): boolean =>
  /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(value.trim());

const chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

async function deleteInvalidPushTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) {
    return;
  }

  await Promise.all([
    pool.query(`DELETE FROM user_push_tokens WHERE expo_push_token = ANY($1::text[])`, [tokens]),
    pool.query(`DELETE FROM mobile_installation_push_tokens WHERE expo_push_token = ANY($1::text[])`, [tokens]),
  ]);
}

async function sendExpoPushBatch(messages: ExpoPushMessage[]): Promise<ExpoPushResponseItem[]> {
  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ExpoPushBatchResponse;
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function sendLiveStartPushNotifications(input: {
  channelId: string;
  sessionId: string;
  title: string;
  body: string;
}): Promise<PushDeliverySummary> {
  const subscriptions = await pool.query<{ expo_push_token: string }>(
    `SELECT DISTINCT recipients.expo_push_token FROM (
     SELECT upt.expo_push_token
     FROM live_subscriptions ls
     INNER JOIN user_push_tokens upt ON upt.user_id = ls.user_id
     INNER JOIN app_users u ON u.id = ls.user_id
     LEFT JOIN user_preferences pref ON pref.user_id = ls.user_id
     WHERE ls.channel_id = $1
       AND u.is_active = TRUE
       AND COALESCE(pref.notifications_enabled, TRUE) = TRUE
     UNION
     SELECT mpt.expo_push_token
       FROM mobile_installation_live_subscriptions mils
       INNER JOIN mobile_installation_push_tokens mpt ON mpt.installation_id = mils.installation_id
       INNER JOIN mobile_installations mi ON mi.id = mils.installation_id
      WHERE mils.channel_id = $1 AND mi.status = 'active' AND mi.notifications_enabled = TRUE
     ) recipients`,
    [input.channelId],
  );

  const tokens = [...new Set(subscriptions.rows.map((row) => row.expo_push_token).filter((token) => isExpoPushToken(token)))];
  if (tokens.length === 0) {
    return {
      attempted: 0,
      accepted: 0,
      invalidTokens: 0,
    };
  }

  let accepted = 0;
  const invalidTokens = new Set<string>();

  for (const group of chunk(tokens, EXPO_BATCH_SIZE)) {
    const messages: ExpoPushMessage[] = group.map((token) => ({
      to: token,
      title: input.title,
      body: input.body,
      sound: 'default',
      priority: 'high',
      data: {
        type: 'live_session_started',
        sessionId: input.sessionId,
        route: `/live/${input.sessionId}`,
        channelId: input.channelId,
      },
    }));

    const results = await sendExpoPushBatch(messages);
    results.forEach((result, index) => {
      if (result.status === 'ok') {
        accepted += 1;
        return;
      }

      if (result.details?.error === 'DeviceNotRegistered') {
        invalidTokens.add(group[index]!);
      }
    });
  }

  if (invalidTokens.size > 0) {
    await deleteInvalidPushTokens([...invalidTokens]);
  }

  return {
    attempted: tokens.length,
    accepted,
    invalidTokens: invalidTokens.size,
  };
}

export interface BroadcastNotificationInput {
  title: string;
  body: string;
  category?: 'new_release' | 'ministry_update' | 'live_service' | 'daily_devotional' | 'announcement';
  contentId?: string | null;
  contentType?: string | null;
  targetAudience?: 'all' | 'registered' | 'guests';
  imageUrl?: string | null;
  deepLinkUrl?: string | null;
  createdBy?: string | null;
}

export interface BroadcastNotificationResult extends PushDeliverySummary {
  campaignId: string;
}

export async function sendContentBroadcastNotification(
  input: BroadcastNotificationInput,
): Promise<BroadcastNotificationResult> {
  let tokenQuery = '';
  const queryParams: unknown[] = [];

  if (input.targetAudience === 'registered') {
    tokenQuery = `
      SELECT DISTINCT upt.expo_push_token
      FROM user_push_tokens upt
      INNER JOIN app_users u ON u.id = upt.user_id
      LEFT JOIN user_preferences pref ON pref.user_id = upt.user_id
      WHERE u.is_active = TRUE
        AND COALESCE(pref.notifications_enabled, TRUE) = TRUE
    `;
  } else if (input.targetAudience === 'guests') {
    tokenQuery = `
      SELECT DISTINCT mpt.expo_push_token
      FROM mobile_installation_push_tokens mpt
      INNER JOIN mobile_installations mi ON mi.id = mpt.installation_id
      WHERE mi.status = 'active'
        AND mi.notifications_enabled = TRUE
    `;
  } else {
    tokenQuery = `
      SELECT DISTINCT recipients.expo_push_token FROM (
        SELECT upt.expo_push_token
        FROM user_push_tokens upt
        INNER JOIN app_users u ON u.id = upt.user_id
        LEFT JOIN user_preferences pref ON pref.user_id = upt.user_id
        WHERE u.is_active = TRUE
          AND COALESCE(pref.notifications_enabled, TRUE) = TRUE
        UNION
        SELECT mpt.expo_push_token
        FROM mobile_installation_push_tokens mpt
        INNER JOIN mobile_installations mi ON mi.id = mpt.installation_id
        WHERE mi.status = 'active'
          AND mi.notifications_enabled = TRUE
      ) recipients
    `;
  }

  const tokenRes = await pool.query<{ expo_push_token: string }>(tokenQuery, queryParams);
  const tokens = [...new Set(tokenRes.rows.map((row) => row.expo_push_token).filter((t) => isExpoPushToken(t)))];

  // Resolve deep link route
  let route = input.deepLinkUrl || '/home';
  if (!input.deepLinkUrl) {
    if (input.contentId) {
      if (input.contentType === 'video') {
        route = `/videos?itemId=${input.contentId}`;
      } else {
        route = `/player?id=${input.contentId}`;
      }
    } else if (input.category === 'live_service') {
      route = '/live';
    } else if (input.category === 'daily_devotional') {
      route = '/word';
    }
  }

  let accepted = 0;
  const invalidTokens = new Set<string>();

  if (tokens.length > 0) {
    for (const group of chunk(tokens, EXPO_BATCH_SIZE)) {
      const messages: ExpoPushMessage[] = group.map((token) => ({
        to: token,
        title: input.title,
        body: input.body,
        sound: 'default',
        priority: 'high',
        data: {
          type: 'content_broadcast',
          category: input.category || 'new_release',
          contentId: input.contentId || undefined,
          contentType: input.contentType || undefined,
          route,
          imageUrl: input.imageUrl || undefined,
        },
      }));

      try {
        const results = await sendExpoPushBatch(messages);
        results.forEach((result, index) => {
          if (result.status === 'ok') {
            accepted += 1;
          } else if (result.details?.error === 'DeviceNotRegistered') {
            invalidTokens.add(group[index]!);
          }
        });
      } catch {
        // If external Expo push service is temporarily unreachable, record attempted
      }
    }

    if (invalidTokens.size > 0) {
      await deleteInvalidPushTokens([...invalidTokens]).catch(() => undefined);
    }
  }

  // Record campaign audit log
  const campaignRes = await pool.query<{ id: string }>(
    `INSERT INTO push_notification_campaigns (
       title, body, category, content_id, target_audience, image_url, deep_link_url,
       recipients_attempted, recipients_accepted, invalid_tokens_pruned, status, created_by
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', $11
     ) RETURNING id`,
    [
      input.title,
      input.body,
      input.category || 'new_release',
      input.contentId || null,
      input.targetAudience || 'all',
      input.imageUrl || null,
      route,
      tokens.length,
      accepted,
      invalidTokens.size,
      input.createdBy || null,
    ],
  );

  return {
    campaignId: campaignRes.rows[0]?.id ?? '',
    attempted: tokens.length,
    accepted,
    invalidTokens: invalidTokens.size,
  };
}
