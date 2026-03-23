import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { HttpError } from '../../lib/httpError';
import { sendLiveStartPushNotifications } from '../../infra/push';
import { queueEmailJob } from '../../infra/transactionalEmails';
import type { UserRole } from '../auth/auth.types';
import type {
  CreateLiveMessageInput,
  CreateLiveSessionInput,
  EndLiveSessionInput,
  ListLiveSessionsQuery,
  LiveMessage,
  LiveMessageKind,
  LiveSession,
  LiveSessionDetail,
  LiveSessionStatus,
  UpdateLiveSessionInput,
} from './live.types';

interface LiveSessionRow {
  id: string;
  title: string;
  description: string;
  status: LiveSessionStatus;
  channel_id: string;
  cover_image_url: string | null;
  stream_url: string | null;
  playback_url: string | null;
  scheduled_for: string | Date | null;
  started_at: string | Date | null;
  ended_at: string | Date | null;
  notify_subscribers: boolean;
  viewer_count: number | string;
  tags: string[] | null;
  app_sections: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
  created_by_id: string | null;
  created_by_display_name: string | null;
  created_by_email: string | null;
  created_by_role: UserRole | null;
  updated_by_id: string | null;
  updated_by_display_name: string | null;
  updated_by_email: string | null;
  updated_by_role: UserRole | null;
  message_count: number | string;
  latest_message_at: string | Date | null;
}

interface LiveMessageRow {
  id: string;
  live_session_id: string;
  kind: LiveMessageKind;
  status: 'visible' | 'hidden';
  message: string;
  created_at: string | Date;
  updated_at: string | Date;
  author_id: string | null;
  author_display_name: string | null;
  author_email: string | null;
  author_role: UserRole | null;
}

const DEFAULT_CHANNEL_ID = 'claudygod-live';

const toIso = (value?: string | Date | null): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

const normalizeTextList = (items?: string[] | null): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toLiveSession = (row: LiveSessionRow): LiveSession => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  channelId: row.channel_id,
  coverImageUrl: row.cover_image_url ?? undefined,
  streamUrl: row.stream_url ?? undefined,
  playbackUrl: row.playback_url ?? undefined,
  scheduledFor: toIso(row.scheduled_for),
  startedAt: toIso(row.started_at),
  endedAt: toIso(row.ended_at),
  notifySubscribers: Boolean(row.notify_subscribers),
  viewerCount: Number(row.viewer_count ?? 0),
  tags: normalizeTextList(row.tags),
  appSections: normalizeTextList(row.app_sections?.length ? row.app_sections : ['live-now']),
  metadata: row.metadata ?? {},
  messageCount: Number(row.message_count ?? 0),
  latestMessageAt: toIso(row.latest_message_at),
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
  createdBy: row.created_by_display_name
    ? {
        id: row.created_by_id ?? undefined,
        displayName: row.created_by_display_name,
        email: row.created_by_email ?? undefined,
        role: row.created_by_role ?? undefined,
      }
    : undefined,
  updatedBy: row.updated_by_display_name
    ? {
        id: row.updated_by_id ?? undefined,
        displayName: row.updated_by_display_name,
        email: row.updated_by_email ?? undefined,
        role: row.updated_by_role ?? undefined,
      }
    : undefined,
});

const toLiveMessage = (row: LiveMessageRow): LiveMessage => ({
  id: row.id,
  liveSessionId: row.live_session_id,
  kind: row.kind,
  visibility: row.status,
  message: row.message,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
  author: {
    id: row.author_id ?? undefined,
    displayName: row.author_display_name || 'ClaudyGod Viewer',
    email: row.author_email ?? undefined,
    role: row.author_role ?? undefined,
  },
});

const liveSessionBaseSelect = `
  SELECT
    ls.id,
    ls.title,
    ls.description,
    ls.status,
    ls.channel_id,
    ls.cover_image_url,
    ls.stream_url,
    ls.playback_url,
    ls.scheduled_for,
    ls.started_at,
    ls.ended_at,
    ls.notify_subscribers,
    ls.viewer_count,
    ls.tags,
    ls.app_sections,
    ls.metadata,
    ls.created_at,
    ls.updated_at,
    creator.id AS created_by_id,
    creator.display_name AS created_by_display_name,
    creator.email AS created_by_email,
    creator.role AS created_by_role,
    updater.id AS updated_by_id,
    updater.display_name AS updated_by_display_name,
    updater.email AS updated_by_email,
    updater.role AS updated_by_role,
    COUNT(msg.id)::int AS message_count,
    MAX(msg.created_at) AS latest_message_at
  FROM live_sessions ls
  LEFT JOIN app_users creator ON creator.id = ls.created_by
  LEFT JOIN app_users updater ON updater.id = ls.updated_by
  LEFT JOIN live_session_messages msg
    ON msg.live_session_id = ls.id
   AND msg.status = 'visible'
`;

const liveSessionGroupBy = `
  GROUP BY
    ls.id,
    creator.id,
    creator.display_name,
    creator.email,
    creator.role,
    updater.id,
    updater.display_name,
    updater.email,
    updater.role
`;

const liveSessionOrder = `
  ORDER BY
    CASE ls.status
      WHEN 'live' THEN 0
      WHEN 'scheduled' THEN 1
      WHEN 'ended' THEN 2
      ELSE 3
    END,
    COALESCE(ls.started_at, ls.scheduled_for, ls.updated_at) DESC,
    ls.created_at DESC
`;

const resolvePublicWatchUrl = (sessionId: string): string => {
  const base = env.AUTH_PUBLIC_BASE_URL.trim().replace(/\/+$/, '');
  if (!base) {
    return `/live/${sessionId}`;
  }
  return `${base}/live/${sessionId}`;
};

const notifySubscribersThatSessionIsLive = async (session: LiveSession): Promise<number> => {
  const subscribers = await pool.query<{ email: string }>(
    `SELECT DISTINCT u.email
     FROM live_subscriptions ls
     INNER JOIN app_users u ON u.id = ls.user_id
     WHERE ls.channel_id = $1
       AND u.is_active = TRUE`,
    [session.channelId || DEFAULT_CHANNEL_ID],
  );

  const recipients = [...new Set(subscribers.rows.map((row) => String(row.email || '').trim().toLowerCase()).filter(Boolean))];
  if (recipients.length === 0) {
    return 0;
  }

  const watchUrl = resolvePublicWatchUrl(session.id);
  const subject = `${env.EMAIL_BRAND_NAME} is live now`;
  const textBody = [
    `${env.EMAIL_BRAND_NAME} just started a live session.`,
    '',
    `Title: ${session.title}`,
    session.description,
    '',
    `Watch now: ${watchUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
  const htmlBody = `<p><strong>${escapeHtml(env.EMAIL_BRAND_NAME)}</strong> just started a live session.</p>
<p><strong>${escapeHtml(session.title)}</strong></p>
<p>${escapeHtml(session.description)}</p>
<p><a href="${escapeHtml(watchUrl)}">Open the live session</a></p>`;

  await queueEmailJob({
    recipients,
    subject,
    textBody,
    htmlBody,
    jobType: 'live_session_started',
    templateKey: 'live.session-started',
    payload: {
      liveSessionId: session.id,
      channelId: session.channelId,
      watchUrl,
    },
  });

  return recipients.length;
};

const assertAdmin = (actor: JwtClaims) => {
  if (actor.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required');
  }
};

const getLiveSessionRowById = async (sessionId: string): Promise<LiveSessionRow> => {
  const result = await pool.query<LiveSessionRow>(
    `${liveSessionBaseSelect}
     WHERE ls.id = $1
     ${liveSessionGroupBy}
     LIMIT 1`,
    [sessionId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Live session not found');
  }

  return result.rows[0]!;
};

export const listAdminLiveSessions = async (actor: JwtClaims): Promise<{
  items: LiveSession[];
  summary: {
    total: number;
    live: number;
    upcoming: number;
    archive: number;
    totalMessages: number;
  };
}> => {
  assertAdmin(actor);

  const result = await pool.query<LiveSessionRow>(
    `${liveSessionBaseSelect}
     ${liveSessionGroupBy}
     ${liveSessionOrder}`,
  );

  const items = result.rows.map(toLiveSession);
  return {
    items,
    summary: {
      total: items.length,
      live: items.filter((item) => item.status === 'live').length,
      upcoming: items.filter((item) => item.status === 'scheduled').length,
      archive: items.filter((item) => item.status === 'ended').length,
      totalMessages: items.reduce((sum, item) => sum + item.messageCount, 0),
    },
  };
};

export const getAdminLiveSessionDetail = async (actor: JwtClaims, sessionId: string): Promise<LiveSessionDetail> => {
  assertAdmin(actor);

  const [sessionRow, messagesResult] = await Promise.all([
    getLiveSessionRowById(sessionId),
    pool.query<LiveMessageRow>(
      `SELECT
         msg.id,
         msg.live_session_id,
         msg.kind,
         msg.status,
         msg.message,
         msg.created_at,
         msg.updated_at,
         author.id AS author_id,
         author.display_name AS author_display_name,
         author.email AS author_email,
         author.role AS author_role
       FROM live_session_messages msg
       LEFT JOIN app_users author ON author.id = msg.user_id
       WHERE msg.live_session_id = $1
       ORDER BY msg.created_at DESC
       LIMIT 120`,
      [sessionId],
    ),
  ]);

  return {
    ...toLiveSession(sessionRow),
    messages: messagesResult.rows.map(toLiveMessage),
  };
};

export const listPublicLiveSessions = async (query: ListLiveSessionsQuery): Promise<{
  items: LiveSession[];
}> => {
  const clauses: string[] = [];

  if (query.scope === 'live') {
    clauses.push(`ls.status = 'live'`);
  } else if (query.scope === 'upcoming') {
    clauses.push(`ls.status = 'scheduled'`);
  } else if (query.scope === 'archive') {
    clauses.push(`ls.status = 'ended'`);
  } else {
    clauses.push(`ls.status IN ('live', 'scheduled', 'ended')`);
  }

  clauses.push(`(ls.status != 'ended' OR COALESCE(ls.ended_at, ls.updated_at) >= NOW() - INTERVAL '45 days')`);

  const result = await pool.query<LiveSessionRow>(
    `${liveSessionBaseSelect}
     WHERE ${clauses.join(' AND ')}
     ${liveSessionGroupBy}
     ${liveSessionOrder}`,
  );

  return {
    items: result.rows.map(toLiveSession),
  };
};

export const getPublicLiveSessionDetail = async (sessionId: string): Promise<LiveSessionDetail> => {
  const [sessionRow, messagesResult] = await Promise.all([
    getLiveSessionRowById(sessionId),
    pool.query<LiveMessageRow>(
      `SELECT
         msg.id,
         msg.live_session_id,
         msg.kind,
         msg.status,
         msg.message,
         msg.created_at,
         msg.updated_at,
         author.id AS author_id,
         author.display_name AS author_display_name,
         author.email AS author_email,
         author.role AS author_role
       FROM live_session_messages msg
       LEFT JOIN app_users author ON author.id = msg.user_id
       WHERE msg.live_session_id = $1
         AND msg.status = 'visible'
       ORDER BY msg.created_at DESC
       LIMIT 80`,
      [sessionId],
    ),
  ]);

  if (sessionRow.status === 'cancelled') {
    throw new HttpError(404, 'Live session not found');
  }

  return {
    ...toLiveSession(sessionRow),
    messages: messagesResult.rows.map(toLiveMessage),
  };
};

export const createLiveSession = async (actor: JwtClaims, input: CreateLiveSessionInput): Promise<LiveSession> => {
  assertAdmin(actor);

  const result = await pool.query<LiveSessionRow>(
    `INSERT INTO live_sessions (
       title,
       description,
       status,
       channel_id,
       cover_image_url,
       stream_url,
       playback_url,
       scheduled_for,
       notify_subscribers,
       viewer_count,
       tags,
       app_sections,
       metadata,
       created_by,
       updated_by
     )
     VALUES (
       $1, $2, 'scheduled', $3, $4, $5, $6, $7, $8, $9, $10::text[], $11::text[], $12::jsonb, $13, $13
     )
     RETURNING id`,
    [
      input.title.trim(),
      input.description.trim(),
      input.channelId?.trim() || DEFAULT_CHANNEL_ID,
      input.coverImageUrl ?? null,
      input.streamUrl ?? null,
      input.playbackUrl ?? null,
      input.scheduledFor ?? null,
      input.notifySubscribers ?? true,
      input.viewerCount ?? 0,
      normalizeTextList(input.tags),
      normalizeTextList(input.appSections?.length ? input.appSections : ['live-now']),
      JSON.stringify(input.metadata ?? {}),
      actor.sub,
    ],
  );

  return toLiveSession(await getLiveSessionRowById(result.rows[0]!.id));
};

export const updateLiveSession = async (
  actor: JwtClaims,
  sessionId: string,
  input: UpdateLiveSessionInput,
): Promise<LiveSession> => {
  assertAdmin(actor);
  await getLiveSessionRowById(sessionId);

  const fields: string[] = [];
  const values: unknown[] = [];

  const pushField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) pushField('title', input.title.trim());
  if (input.description !== undefined) pushField('description', input.description.trim());
  if (input.status !== undefined) pushField('status', input.status);
  if (input.channelId !== undefined) pushField('channel_id', input.channelId.trim() || DEFAULT_CHANNEL_ID);
  if (input.coverImageUrl !== undefined) pushField('cover_image_url', input.coverImageUrl ?? null);
  if (input.streamUrl !== undefined) pushField('stream_url', input.streamUrl ?? null);
  if (input.playbackUrl !== undefined) pushField('playback_url', input.playbackUrl ?? null);
  if (input.scheduledFor !== undefined) pushField('scheduled_for', input.scheduledFor ?? null);
  if (input.notifySubscribers !== undefined) pushField('notify_subscribers', input.notifySubscribers);
  if (input.viewerCount !== undefined) pushField('viewer_count', input.viewerCount);
  if (input.tags !== undefined) pushField('tags', normalizeTextList(input.tags));
  if (input.appSections !== undefined) pushField('app_sections', normalizeTextList(input.appSections));
  if (input.metadata !== undefined) {
    values.push(JSON.stringify(input.metadata ?? {}));
    fields.push(`metadata = $${values.length}::jsonb`);
  }

  pushField('updated_by', actor.sub);

  values.push(sessionId);
  await pool.query(
    `UPDATE live_sessions
     SET ${fields.join(', ')}
     WHERE id = $${values.length}`,
    values,
  );

  return toLiveSession(await getLiveSessionRowById(sessionId));
};

export const startLiveSession = async (actor: JwtClaims, sessionId: string): Promise<{
  session: LiveSession;
  notifiedSubscribers: number;
  notifiedDevices: number;
  attemptedDevices: number;
}> => {
  assertAdmin(actor);
  const existing = await getLiveSessionRowById(sessionId);
  const wasLive = existing.status === 'live';

  await pool.query(
    `UPDATE live_sessions
     SET status = 'live',
         started_at = COALESCE(started_at, NOW()),
         ended_at = NULL,
         updated_by = $2
     WHERE id = $1`,
    [sessionId, actor.sub],
  );

  const session = toLiveSession(await getLiveSessionRowById(sessionId));
  let notifiedSubscribers = 0;
  let notifiedDevices = 0;
  let attemptedDevices = 0;

  if (!wasLive && session.notifySubscribers) {
    const [emailResult, pushResult] = await Promise.allSettled([
      notifySubscribersThatSessionIsLive(session),
      sendLiveStartPushNotifications({
        channelId: session.channelId || DEFAULT_CHANNEL_ID,
        sessionId: session.id,
        title: `${env.EMAIL_BRAND_NAME} is live now`,
        body: session.title,
      }),
    ]);

    if (emailResult.status === 'fulfilled') {
      notifiedSubscribers = emailResult.value;
    }
    if (pushResult.status === 'fulfilled') {
      notifiedDevices = pushResult.value.delivered;
      attemptedDevices = pushResult.value.attempted;
    }
  }

  return {
    session,
    notifiedSubscribers,
    notifiedDevices,
    attemptedDevices,
  };
};

export const endLiveSession = async (
  actor: JwtClaims,
  sessionId: string,
  input: EndLiveSessionInput,
): Promise<LiveSession> => {
  assertAdmin(actor);
  await getLiveSessionRowById(sessionId);

  await pool.query(
    `UPDATE live_sessions
     SET status = 'ended',
         ended_at = NOW(),
         playback_url = COALESCE($2, playback_url),
         viewer_count = COALESCE($3, viewer_count),
         updated_by = $4
     WHERE id = $1`,
    [sessionId, input.playbackUrl ?? null, input.viewerCount ?? null, actor.sub],
  );

  return toLiveSession(await getLiveSessionRowById(sessionId));
};

export const createLiveSessionMessage = async (
  actor: JwtClaims,
  sessionId: string,
  input: CreateLiveMessageInput,
): Promise<LiveMessage> => {
  const session = await getLiveSessionRowById(sessionId);
  if (session.status === 'cancelled') {
    throw new HttpError(400, 'This live session is no longer available');
  }

  const inserted = await pool.query<LiveMessageRow>(
    `INSERT INTO live_session_messages (
       live_session_id,
       user_id,
       display_name,
       kind,
       status,
       message
     )
     VALUES ($1, $2, $3, $4, 'visible', $5)
     RETURNING
       id,
       live_session_id,
       kind,
       status,
       message,
       created_at,
       updated_at,
       $2::uuid AS author_id,
       $3::text AS author_display_name,
       $6::text AS author_email,
       $7::text AS author_role`,
    [sessionId, actor.sub, actor.displayName, input.kind, input.message.trim(), actor.email, actor.role],
  );

  return toLiveMessage(inserted.rows[0]!);
};
