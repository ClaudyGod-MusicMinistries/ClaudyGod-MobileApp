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
  delivered: number;
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

  await pool.query(
    `DELETE FROM user_push_tokens
     WHERE expo_push_token = ANY($1::text[])`,
    [tokens],
  );
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
    `SELECT DISTINCT upt.expo_push_token
     FROM live_subscriptions ls
     INNER JOIN user_push_tokens upt ON upt.user_id = ls.user_id
     INNER JOIN app_users u ON u.id = ls.user_id
     LEFT JOIN user_preferences pref ON pref.user_id = ls.user_id
     WHERE ls.channel_id = $1
       AND u.is_active = TRUE
       AND COALESCE(pref.notifications_enabled, TRUE) = TRUE`,
    [input.channelId],
  );

  const tokens = [...new Set(subscriptions.rows.map((row) => row.expo_push_token).filter((token) => isExpoPushToken(token)))];
  if (tokens.length === 0) {
    return {
      attempted: 0,
      delivered: 0,
      invalidTokens: 0,
    };
  }

  let delivered = 0;
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
        delivered += 1;
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
    delivered,
    invalidTokens: invalidTokens.size,
  };
}
