import crypto from 'node:crypto';
import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { queueAccountEmailChangeEmail, queueProfileUpdatedEmail } from '../../infra/transactionalEmails';
import { HttpError } from '../../lib/httpError';
import { isDatabaseConnectivityError, isMissingDatabaseStructureError } from '../../lib/postgres';
import { verifyPassword } from '../../utils/password';
import { listMostPlayedContent } from '../analytics/analytics.service';
import { getMobileAppConfig } from '../appConfig/appConfig.service';
import { requestPasswordReset } from '../auth/auth.service';
import { revokeAllUserSessions } from '../auth/authSession.service';

type MeContentType = 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';
type ThemePreference = 'system' | 'light' | 'dark';

interface MeProfileRow {
  user_id: string;
  email: string;
  display_name: string;
  role: 'CLIENT' | 'ADMIN';
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  locale: string | null;
  timezone: string | null;
  bio: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface MePreferencesRow {
  notifications_enabled: boolean;
  autoplay_enabled: boolean;
  high_quality_enabled: boolean;
  diagnostics_enabled: boolean;
  personalization_enabled: boolean;
  theme_preference: ThemePreference;
  updated_at: string | Date;
}

interface CountRow {
  count: string;
}

interface AccountCredentialRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
  auth_provider: string;
}

interface PrivacyRequestRow {
  id: string;
  request_type: 'export' | 'delete';
  status: 'submitted' | 'processing' | 'completed' | 'rejected';
  created_at: string | Date;
}

interface SavedItemRow {
  id: string;
  bucket: 'liked' | 'downloaded' | 'playlist';
  playlist_name: string | null;
  content_id: string;
  content_type: MeContentType;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  media_url: string | null;
  duration: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface MeEngagementRow {
  content_id: string;
  content_title: string;
  content_type: string;
  description: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  duration_label: string | null;
  source_kind: string | null;
  app_sections: string[] | null;
  tags: string[] | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  last_played_at?: string | Date | null;
  play_count?: string | null;
}

const toIso = (value: string | Date): string => new Date(value).toISOString();
const ACCOUNT_ACTION_TOKEN_BYTES = 32;
const ACCOUNT_EMAIL_CHANGE_TTL_MINUTES = 30;

const tokenHash = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const createRawToken = (): string =>
  crypto.randomBytes(ACCOUNT_ACTION_TOKEN_BYTES).toString('hex');

const normalizeTextList = (items?: string[] | null): string[] =>
  [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];

const normalizeContentType = (value?: string | null): MeContentType =>
  value === 'audio' ||
  value === 'video' ||
  value === 'playlist' ||
  value === 'announcement' ||
  value === 'live' ||
  value === 'ad'
    ? value
    : 'audio';

const toEngagementItem = (row: MeEngagementRow) => {
  const createdAt = row.created_at
    ? toIso(row.created_at)
    : row.last_played_at
      ? toIso(row.last_played_at)
      : new Date().toISOString();
  const updatedAt = row.updated_at ? toIso(row.updated_at) : createdAt;

  return {
    id: row.content_id,
    title: row.content_title,
    description: row.description ?? '',
    subtitle: row.channel_name ?? 'ClaudyGod',
    type: normalizeContentType(row.content_type),
    imageUrl: row.thumbnail_url ?? '',
    mediaUrl: row.media_url ?? undefined,
    duration: row.duration_label ?? undefined,
    sourceKind: row.source_kind ?? undefined,
    appSections: normalizeTextList(row.app_sections),
    tags: normalizeTextList(row.tags),
    createdAt,
    updatedAt,
    playCount: row.play_count ? Number(row.play_count) : undefined,
    lastPlayedAt: row.last_played_at ? toIso(row.last_played_at) : undefined,
  };
};

const toMostPlayedEngagementItem = (row: {
  id: string;
  title: string;
  description: string;
  type: MeContentType;
  url?: string;
  createdAt: string;
  updatedAt: string;
  playCount: number;
}) => ({
  id: row.id,
  title: row.title,
  description: row.description ?? '',
  subtitle: 'ClaudyGod',
  type: normalizeContentType(row.type),
  imageUrl: '',
  mediaUrl: row.url,
  duration: undefined,
  sourceKind: undefined,
  appSections: [],
  tags: [],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  playCount: row.playCount,
  lastPlayedAt: undefined,
});

const profileFieldLabels: Record<
  'display_name' | 'avatar_url' | 'phone' | 'country' | 'locale' | 'timezone' | 'bio',
  string
> = {
  display_name: 'Display name',
  avatar_url: 'Profile image',
  phone: 'Phone number',
  country: 'Country',
  locale: 'Language or locale',
  timezone: 'Timezone',
  bio: 'Bio',
};

const ensureMeScaffold = async (user: JwtClaims): Promise<void> => {
  await Promise.all([
    pool.query(
      `INSERT INTO user_profiles (user_id, display_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           updated_at = NOW()`,
      [user.sub, user.displayName, user.email],
    ),
    pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.sub],
    ),
  ]);
};

const readProfile = async (userId: string): Promise<MeProfileRow> => {
  const result = await pool.query<MeProfileRow>(
    `SELECT
       u.id AS user_id,
       u.email,
       u.display_name,
       u.role,
       COALESCE(p.avatar_url, u.avatar_url) AS avatar_url,
       COALESCE(p.phone, u.phone) AS phone,
       COALESCE(p.country, u.country) AS country,
       COALESCE(p.locale, u.locale) AS locale,
       COALESCE(p.timezone, u.timezone) AS timezone,
       p.bio,
       u.created_at,
       GREATEST(u.updated_at, COALESCE(p.updated_at, u.updated_at)) AS updated_at
     FROM app_users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'User profile not found');
  }
  return result.rows[0]!;
};

const readPreferences = async (userId: string): Promise<MePreferencesRow> => {
  const result = await pool.query<MePreferencesRow>(
    `SELECT
       notifications_enabled,
       autoplay_enabled,
       high_quality_enabled,
       diagnostics_enabled,
       personalization_enabled,
       theme_preference,
       updated_at
     FROM user_preferences
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'User preferences not found');
  }
  return result.rows[0]!;
};

const readAccountCredentials = async (userId: string): Promise<AccountCredentialRow> => {
  const result = await pool.query<AccountCredentialRow>(
    `SELECT id, email, display_name, password_hash, auth_provider
     FROM app_users
     WHERE id = $1
       AND is_active = TRUE
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Account not found');
  }

  return result.rows[0]!;
};

const assertCurrentPassword = async (userId: string, currentPassword: string): Promise<AccountCredentialRow> => {
  const account = await readAccountCredentials(userId);

  if (!account.password_hash) {
    throw new HttpError(
      400,
      'This account is managed by an external sign-in provider. Use that provider to change security credentials.',
      { reason: 'external_auth_provider', provider: account.auth_provider },
      'ACCOUNT_EXTERNAL_AUTH_PROVIDER',
      'currentPassword',
    );
  }

  const passwordMatches = await verifyPassword(currentPassword, account.password_hash);
  if (!passwordMatches) {
    throw new HttpError(
      403,
      'Current password is incorrect.',
      { reason: 'invalid_current_password' },
      'ACCOUNT_INVALID_CURRENT_PASSWORD',
      'currentPassword',
    );
  }

  return account;
};

const recordAccountActivity = async (input: {
  userId: string;
  email: string;
  eventKey: string;
  status?: 'success' | 'failure' | 'info';
  requestIp?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) => {
  await pool.query(
    `INSERT INTO auth_activity_events (user_id, email, event_key, status, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      input.userId,
      input.email,
      input.eventKey,
      input.status ?? 'info',
      input.requestIp ?? null,
      input.userAgent ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
};

export const getMeProfile = async (user: JwtClaims): Promise<{
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'CLIENT' | 'ADMIN';
    avatarUrl?: string;
    phone?: string;
    country?: string;
    locale?: string;
    timezone?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
  };
}> => {
  await ensureMeScaffold(user);
  const row = await readProfile(user.sub);
  return {
    user: {
      id: row.user_id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      avatarUrl: row.avatar_url ?? undefined,
      phone: row.phone ?? undefined,
      country: row.country ?? undefined,
      locale: row.locale ?? undefined,
      timezone: row.timezone ?? undefined,
      bio: row.bio ?? undefined,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    },
  };
};

export const updateMeProfile = async (
  user: JwtClaims,
  input: {
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
    country?: string;
    locale?: string;
    timezone?: string;
    bio?: string;
  },
): Promise<{
  user: Awaited<ReturnType<typeof getMeProfile>>['user'];
}> => {
  await ensureMeScaffold(user);
  const previousProfile = await readProfile(user.sub);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE app_users
       SET
         display_name = COALESCE($2, display_name),
         avatar_url = COALESCE($3, avatar_url),
         phone = COALESCE($4, phone),
         country = COALESCE($5, country),
         locale = COALESCE($6, locale),
         timezone = COALESCE($7, timezone)
       WHERE id = $1`,
      [
        user.sub,
        input.displayName ?? null,
        input.avatarUrl ?? null,
        input.phone ?? null,
        input.country ?? null,
        input.locale ?? null,
        input.timezone ?? null,
      ],
    );

    await client.query(
      `INSERT INTO user_profiles (
         user_id, display_name, email, avatar_url, phone, country, locale, timezone, bio
       )
       SELECT id, COALESCE($2, display_name), email, $3, $4, $5, COALESCE($6, locale), $7, $8
       FROM app_users
       WHERE id = $1
       ON CONFLICT (user_id) DO UPDATE
       SET
         display_name = COALESCE($2, user_profiles.display_name),
         avatar_url = COALESCE($3, user_profiles.avatar_url),
         phone = COALESCE($4, user_profiles.phone),
         country = COALESCE($5, user_profiles.country),
         locale = COALESCE($6, user_profiles.locale),
         timezone = COALESCE($7, user_profiles.timezone),
         bio = COALESCE($8, user_profiles.bio),
         updated_at = NOW()`,
      [
        user.sub,
        input.displayName ?? null,
        input.avatarUrl ?? null,
        input.phone ?? null,
        input.country ?? null,
        input.locale ?? null,
        input.timezone ?? null,
        input.bio ?? null,
      ],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const nextProfile = await readProfile(user.sub);
  const changedFields = (
    Object.entries(profileFieldLabels) as Array<
      [keyof typeof profileFieldLabels, string]
    >
  )
    .filter(([key]) => (previousProfile[key] ?? null) !== (nextProfile[key] ?? null))
    .map(([, label]) => label);

  if (changedFields.length > 0) {
    await queueProfileUpdatedEmail({
      user: {
        id: user.sub,
        email: nextProfile.email,
        displayName: nextProfile.display_name,
      },
      changedFields,
    });
  }

  return {
    user: {
      id: nextProfile.user_id,
      email: nextProfile.email,
      displayName: nextProfile.display_name,
      role: nextProfile.role,
      avatarUrl: nextProfile.avatar_url ?? undefined,
      phone: nextProfile.phone ?? undefined,
      country: nextProfile.country ?? undefined,
      locale: nextProfile.locale ?? undefined,
      timezone: nextProfile.timezone ?? undefined,
      bio: nextProfile.bio ?? undefined,
      createdAt: toIso(nextProfile.created_at),
      updatedAt: toIso(nextProfile.updated_at),
    },
  };
};

export const requestMeEmailChange = async (
  user: JwtClaims,
  input: { newEmail: string; currentPassword: string },
  context: { requestIp?: string; userAgent?: string } = {},
): Promise<{ message: string; expiresInMinutes: number }> => {
  const account = await assertCurrentPassword(user.sub, input.currentPassword);
  const newEmail = input.newEmail.trim().toLowerCase();

  if (newEmail === account.email.toLowerCase()) {
    throw new HttpError(400, 'Enter a different email address.', { reason: 'same_email' }, 'ACCOUNT_SAME_EMAIL', 'newEmail');
  }

  const existingEmail = await pool.query<{ id: string }>(
    `SELECT id FROM app_users WHERE email = $1 AND id <> $2 LIMIT 1`,
    [newEmail, user.sub],
  );
  if ((existingEmail.rowCount ?? 0) > 0) {
    throw new HttpError(409, 'That email address is already in use.', { reason: 'email_in_use' }, 'ACCOUNT_EMAIL_IN_USE', 'newEmail');
  }

  const rawToken = createRawToken();
  const expiresAt = new Date(Date.now() + ACCOUNT_EMAIL_CHANGE_TTL_MINUTES * 60 * 1000);

  await pool.query(
    `UPDATE account_change_requests
     SET status = 'cancelled', updated_at = NOW()
     WHERE user_id = $1
       AND request_type = 'email_change'
       AND status = 'pending'`,
    [user.sub],
  );

  await pool.query(
    `INSERT INTO account_change_requests (
       user_id, request_type, token_hash, current_email, new_email, expires_at, requested_ip, metadata
     )
     VALUES ($1, 'email_change', $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      user.sub,
      tokenHash(rawToken),
      account.email,
      newEmail,
      expiresAt.toISOString(),
      context.requestIp ?? null,
      JSON.stringify({ userAgent: context.userAgent ?? null }),
    ],
  );

  await queueAccountEmailChangeEmail({
    user: {
      id: account.id,
      email: account.email,
      displayName: account.display_name,
    },
    newEmail,
    rawToken,
    expiresInMinutes: ACCOUNT_EMAIL_CHANGE_TTL_MINUTES,
  });

  await recordAccountActivity({
    userId: user.sub,
    email: account.email,
    eventKey: 'email_change_requested',
    status: 'info',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
    metadata: { newEmail },
  });

  return {
    message: 'We sent a secure confirmation link to your current email address.',
    expiresInMinutes: ACCOUNT_EMAIL_CHANGE_TTL_MINUTES,
  };
};

export const confirmMeEmailChange = async (
  user: JwtClaims,
  input: { token: string },
  context: { requestIp?: string; userAgent?: string } = {},
): Promise<{ message: string; email: string }> => {
  const requestResult = await pool.query<{
    id: string;
    user_id: string;
    current_email: string;
    new_email: string;
  }>(
    `SELECT id, user_id, current_email, new_email
     FROM account_change_requests
     WHERE token_hash = $1
       AND request_type = 'email_change'
       AND status = 'pending'
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash(input.token)],
  );

  if (requestResult.rowCount === 0) {
    throw new HttpError(400, 'This email change link is invalid or has expired.', { reason: 'invalid_token' }, 'ACCOUNT_INVALID_EMAIL_CHANGE_TOKEN', 'token');
  }

  const request = requestResult.rows[0]!;
  if (request.user_id !== user.sub) {
    throw new HttpError(403, 'Sign in to the account that requested this email change.', { reason: 'wrong_account' }, 'ACCOUNT_EMAIL_CHANGE_WRONG_ACCOUNT');
  }

  const existingEmail = await pool.query<{ id: string }>(
    `SELECT id FROM app_users WHERE email = $1 AND id <> $2 LIMIT 1`,
    [request.new_email, user.sub],
  );
  if ((existingEmail.rowCount ?? 0) > 0) {
    throw new HttpError(409, 'That email address is already in use.', { reason: 'email_in_use' }, 'ACCOUNT_EMAIL_IN_USE', 'newEmail');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE app_users
       SET email = $2,
           email_verified_at = NOW()
       WHERE id = $1`,
      [user.sub, request.new_email],
    );
    await client.query(
      `UPDATE user_profiles
       SET email = $2
       WHERE user_id = $1`,
      [user.sub, request.new_email],
    );
    await client.query(
      `UPDATE account_change_requests
       SET status = 'completed',
           used_at = NOW()
       WHERE id = $1`,
      [request.id],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await revokeAllUserSessions(user.sub);
  await recordAccountActivity({
    userId: user.sub,
    email: request.new_email,
    eventKey: 'email_change_completed',
    status: 'success',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
    metadata: { previousEmail: request.current_email },
  });

  return {
    message: 'Your email address has been updated. Sign in again with the new email.',
    email: request.new_email,
  };
};

export const requestMePasswordChange = async (
  user: JwtClaims,
  input: { currentPassword: string },
  context: { requestIp?: string; userAgent?: string } = {},
): Promise<{ message: string }> => {
  const account = await assertCurrentPassword(user.sub, input.currentPassword);

  await requestPasswordReset(
    { email: account.email },
    {
      requestIp: context.requestIp,
      userAgent: context.userAgent,
    },
  );

  await recordAccountActivity({
    userId: user.sub,
    email: account.email,
    eventKey: 'password_change_requested',
    status: 'info',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
  });

  return {
    message: 'We sent a secure password change link to your email address.',
  };
};

export const getMePreferences = async (user: JwtClaims): Promise<{
  preferences: {
    notificationsEnabled: boolean;
    autoplayEnabled: boolean;
    highQualityEnabled: boolean;
    diagnosticsEnabled: boolean;
    personalizationEnabled: boolean;
    themePreference: ThemePreference;
    updatedAt: string;
  };
}> => {
  await ensureMeScaffold(user);
  const row = await readPreferences(user.sub);
  return {
    preferences: {
      notificationsEnabled: row.notifications_enabled,
      autoplayEnabled: row.autoplay_enabled,
      highQualityEnabled: row.high_quality_enabled,
      diagnosticsEnabled: row.diagnostics_enabled,
      personalizationEnabled: row.personalization_enabled,
      themePreference: row.theme_preference,
      updatedAt: toIso(row.updated_at),
    },
  };
};

export const updateMePreferences = async (
  user: JwtClaims,
  input: {
    notificationsEnabled?: boolean;
    autoplayEnabled?: boolean;
    highQualityEnabled?: boolean;
    diagnosticsEnabled?: boolean;
    personalizationEnabled?: boolean;
    themePreference?: ThemePreference;
  },
) => {
  await ensureMeScaffold(user);

  await pool.query(
    `UPDATE user_preferences
     SET
       notifications_enabled = COALESCE($2, notifications_enabled),
       autoplay_enabled = COALESCE($3, autoplay_enabled),
       high_quality_enabled = COALESCE($4, high_quality_enabled),
       diagnostics_enabled = COALESCE($5, diagnostics_enabled),
       personalization_enabled = COALESCE($6, personalization_enabled),
       theme_preference = COALESCE($7, theme_preference)
     WHERE user_id = $1`,
    [
      user.sub,
      input.notificationsEnabled ?? null,
      input.autoplayEnabled ?? null,
      input.highQualityEnabled ?? null,
      input.diagnosticsEnabled ?? null,
      input.personalizationEnabled ?? null,
      input.themePreference ?? null,
    ],
  );

  return getMePreferences(user);
};

export const getMeMetrics = async (user: JwtClaims): Promise<{
  email: string;
  displayName: string;
  totalPlays: number;
  liveSubscriptions: number;
}> => {
  await ensureMeScaffold(user);
  const [profile, playsCount, liveCount] = await Promise.all([
    readProfile(user.sub),
    pool.query<CountRow>(`SELECT COUNT(*)::text AS count FROM user_play_events WHERE user_id = $1`, [user.sub]),
    pool.query<CountRow>(`SELECT COUNT(*)::text AS count FROM live_subscriptions WHERE user_id = $1`, [user.sub]),
  ]);

  return {
    email: profile.email,
    displayName: profile.display_name,
    totalPlays: Number(playsCount.rows[0]?.count ?? '0'),
    liveSubscriptions: Number(liveCount.rows[0]?.count ?? '0'),
  };
};

export const recordMePlayEvent = async (
  user: JwtClaims,
  input: {
    contentId: string;
    contentType: MeContentType;
    title: string;
    source?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ recorded: true }> => {
  await pool.query(
    `INSERT INTO user_play_events (
       user_id, content_id, content_type, content_title, source_screen, metadata, played_at
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
    [
      user.sub,
      input.contentId,
      input.contentType,
      input.title,
      input.source ?? 'unknown',
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return { recorded: true };
};

export const getMeRecentlyPlayed = async (
  user: JwtClaims,
  params: { limit?: number; windowDays?: number },
): Promise<{ items: ReturnType<typeof toEngagementItem>[] }> => {
  const limit = params.limit ?? 12;
  const windowDays = params.windowDays ?? 30;

  let result;
  try {
    result = await pool.query<MeEngagementRow>(
      `SELECT
         e.content_id,
         COALESCE(c.title, e.content_title) AS content_title,
         COALESCE(c.content_type, e.content_type) AS content_type,
         c.description,
         c.media_url,
         c.thumbnail_url,
         c.channel_name,
         c.duration_label,
         c.source_kind,
         c.app_sections,
         c.tags,
         c.created_at,
         c.updated_at,
         MAX(e.played_at) AS last_played_at
       FROM user_play_events e
       LEFT JOIN content_items c ON c.id::text = e.content_id
       WHERE e.user_id = $1
         AND e.played_at >= NOW() - ($3::text || ' days')::interval
       GROUP BY
         e.content_id,
         c.title,
         e.content_title,
         c.content_type,
         e.content_type,
         c.description,
         c.media_url,
         c.thumbnail_url,
         c.channel_name,
         c.duration_label,
         c.source_kind,
         c.app_sections,
         c.tags,
         c.created_at,
         c.updated_at
       ORDER BY MAX(e.played_at) DESC
       LIMIT $2`,
      [user.sub, limit, windowDays],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error) || isDatabaseConnectivityError(error)) {
      return { items: [] };
    }
    throw error;
  }

  return { items: result.rows.map(toEngagementItem) };
};

export const getMeMostPlayed = async (
  user: JwtClaims,
  params: { limit?: number; windowDays?: number },
): Promise<{ items: ReturnType<typeof toEngagementItem>[] }> => {
  const limit = params.limit ?? 12;
  const windowDays = params.windowDays ?? 90;

  let result;
  try {
    result = await pool.query<MeEngagementRow>(
      `SELECT
         e.content_id,
         COALESCE(c.title, e.content_title) AS content_title,
         COALESCE(c.content_type, e.content_type) AS content_type,
         c.description,
         c.media_url,
         c.thumbnail_url,
         c.channel_name,
         c.duration_label,
         c.source_kind,
         c.app_sections,
         c.tags,
         c.created_at,
         c.updated_at,
         COUNT(*)::text AS play_count,
         MAX(e.played_at) AS last_played_at
       FROM user_play_events e
       LEFT JOIN content_items c ON c.id::text = e.content_id
       WHERE e.user_id = $1
         AND e.played_at >= NOW() - ($3::text || ' days')::interval
       GROUP BY
         e.content_id,
         c.title,
         e.content_title,
         c.content_type,
         e.content_type,
         c.description,
         c.media_url,
         c.thumbnail_url,
         c.channel_name,
         c.duration_label,
         c.source_kind,
         c.app_sections,
         c.tags,
         c.created_at,
         c.updated_at
       ORDER BY COUNT(*)::int DESC, MAX(e.played_at) DESC
       LIMIT $2`,
      [user.sub, limit, windowDays],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error) || isDatabaseConnectivityError(error)) {
      return { items: [] };
    }
    throw error;
  }

  return { items: result.rows.map(toEngagementItem) };
};

export const getMeRecommendations = async (
  user: JwtClaims,
  params: { limit?: number; windowDays?: number },
): Promise<{ items: ReturnType<typeof toEngagementItem>[] }> => {
  const limit = params.limit ?? 12;
  const windowDays = params.windowDays ?? 120;

  let preferences: {
    preferences: {
      notificationsEnabled: boolean;
      autoplayEnabled: boolean;
      highQualityEnabled: boolean;
      diagnosticsEnabled: boolean;
      personalizationEnabled: boolean;
      themePreference: ThemePreference;
      updatedAt: string;
    };
  };
  try {
    preferences = await getMePreferences(user);
  } catch {
    return { items: [] };
  }

  if (!preferences.preferences.personalizationEnabled) {
    return { items: [] };
  }

  try {
    const [tagRows, sectionRows] = await Promise.all([
      pool.query<{ tag: string }>(
        `SELECT tag
         FROM (
           SELECT unnest(c.tags) AS tag, COUNT(*)::int AS count
           FROM user_play_events e
           JOIN content_items c ON c.id::text = e.content_id
           WHERE e.user_id = $1
             AND e.played_at >= NOW() - ($2::text || ' days')::interval
             AND c.tags IS NOT NULL
           GROUP BY tag
           ORDER BY count DESC
           LIMIT 16
         ) tags`,
        [user.sub, windowDays],
      ),
      pool.query<{ section: string }>(
        `SELECT section
         FROM (
           SELECT unnest(c.app_sections) AS section, COUNT(*)::int AS count
           FROM user_play_events e
           JOIN content_items c ON c.id::text = e.content_id
           WHERE e.user_id = $1
             AND e.played_at >= NOW() - ($2::text || ' days')::interval
             AND c.app_sections IS NOT NULL
           GROUP BY section
           ORDER BY count DESC
           LIMIT 16
         ) sections`,
        [user.sub, windowDays],
      ),
    ]);

    const tags = tagRows.rows.map((row) => row.tag);
    const sections = sectionRows.rows.map((row) => row.section);

    if (tags.length === 0 && sections.length === 0) {
      const fallback = await listMostPlayedContent({ limit, windowDays: 90 });
      return {
        items: fallback.items.map((item) => ({
          ...toMostPlayedEngagementItem(item),
          lastPlayedAt: undefined,
        })),
      };
    }

    const recResult = await pool.query<MeEngagementRow>(
      `SELECT
         c.id::text AS content_id,
         c.title AS content_title,
         c.content_type AS content_type,
         c.description,
         c.media_url,
         c.thumbnail_url,
         c.channel_name,
         c.duration_label,
         c.source_kind,
         c.app_sections,
         c.tags,
         c.created_at,
         c.updated_at
       FROM content_items c
       WHERE c.visibility = 'published'
         AND (
           ($2::text[] <> '{}'::text[] AND c.tags && $2::text[])
           OR ($3::text[] <> '{}'::text[] AND c.app_sections && $3::text[])
         )
         AND c.id::text NOT IN (
           SELECT content_id FROM user_play_events WHERE user_id = $1
         )
       ORDER BY
         COALESCE(array_length(ARRAY(SELECT unnest(c.tags) INTERSECT SELECT unnest($2::text[])), 1), 0)
         + COALESCE(array_length(ARRAY(SELECT unnest(c.app_sections) INTERSECT SELECT unnest($3::text[])), 1), 0) DESC,
         c.updated_at DESC
       LIMIT $4`,
      [user.sub, tags, sections, limit],
    );

    return { items: recResult.rows.map(toEngagementItem) };
  } catch (error) {
    if (isMissingDatabaseStructureError(error) || isDatabaseConnectivityError(error)) {
      return { items: [] };
    }
    throw error;
  }
};

export const upsertMeLiveSubscription = async (
  user: JwtClaims,
  input: { channelId: string; label?: string },
): Promise<{ subscription: { channelId: string; label?: string } }> => {
  await pool.query(
    `INSERT INTO live_subscriptions (user_id, channel_id, label)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, channel_id)
     DO UPDATE SET
       label = COALESCE(EXCLUDED.label, live_subscriptions.label),
       updated_at = NOW()`,
    [user.sub, input.channelId, input.label ?? null],
  );

  return {
    subscription: {
      channelId: input.channelId,
      label: input.label,
    },
  };
};

export const saveMePushToken = async (
  user: JwtClaims,
  input: { expoPushToken: string; deviceType?: string },
): Promise<{ saved: true }> => {
  await ensureMeScaffold(user);

  await pool.query(
    `INSERT INTO user_push_tokens (user_id, expo_push_token, device_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, expo_push_token)
     DO UPDATE SET
       device_type = COALESCE(EXCLUDED.device_type, user_push_tokens.device_type),
       updated_at = NOW()`,
    [user.sub, input.expoPushToken, input.deviceType ?? 'unknown'],
  );

  return { saved: true };
};

export const removeMePushToken = async (
  user: JwtClaims,
  input: { expoPushToken: string },
): Promise<{ removed: boolean }> => {
  const result = await pool.query(
    `DELETE FROM user_push_tokens
     WHERE user_id = $1
       AND expo_push_token = $2`,
    [user.sub, input.expoPushToken],
  );

  return { removed: (result.rowCount ?? 0) > 0 };
};

export const getMeLibrary = async (user: JwtClaims): Promise<{
  liked: Array<Record<string, unknown>>;
  downloaded: Array<Record<string, unknown>>;
  playlists: Array<{ name: string; items: Array<Record<string, unknown>> }>;
}> => {
  const result = await pool.query<SavedItemRow>(
    `SELECT *
     FROM user_saved_items
     WHERE user_id = $1
     ORDER BY updated_at DESC, created_at DESC`,
    [user.sub],
  );

  const toItem = (row: SavedItemRow) => ({
    id: row.content_id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    type: row.content_type,
    imageUrl: row.image_url ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    duration: row.duration ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  });

  const liked = result.rows.filter((row) => row.bucket === 'liked').map(toItem);
  const downloaded = result.rows.filter((row) => row.bucket === 'downloaded').map(toItem);

  const playlistMap = new Map<string, Array<Record<string, unknown>>>();
  for (const row of result.rows.filter((entry) => entry.bucket === 'playlist')) {
    const key = row.playlist_name || 'Playlist';
    const items = playlistMap.get(key) ?? [];
    items.push(toItem(row));
    playlistMap.set(key, items);
  }

  return {
    liked,
    downloaded,
    playlists: [...playlistMap.entries()].map(([name, items]) => ({ name, items })),
  };
};

export const saveMeLibraryItem = async (
  user: JwtClaims,
  input: {
    bucket: 'liked' | 'downloaded' | 'playlist';
    playlistName?: string;
    contentId: string;
    contentType: MeContentType;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    mediaUrl?: string;
    duration?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ saved: true }> => {
  await pool.query(
    `DELETE FROM user_saved_items
     WHERE user_id = $1
       AND bucket = $2
       AND content_id = $3
       AND COALESCE(playlist_name, '') = COALESCE($4, '')`,
    [user.sub, input.bucket, input.contentId, input.playlistName ?? null],
  );

  await pool.query(
    `INSERT INTO user_saved_items (
       user_id, bucket, playlist_name, content_id, content_type, title, subtitle, description,
       image_url, media_url, duration, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
    [
      user.sub,
      input.bucket,
      input.playlistName ?? null,
      input.contentId,
      input.contentType,
      input.title,
      input.subtitle ?? '',
      input.description ?? '',
      input.imageUrl ?? null,
      input.mediaUrl ?? null,
      input.duration ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return { saved: true };
};

export const removeMeLibraryItem = async (
  user: JwtClaims,
  input: {
    bucket: 'liked' | 'downloaded' | 'playlist';
    contentId: string;
    playlistName?: string;
  },
): Promise<{ removed: boolean }> => {
  const result = await pool.query(
    `DELETE FROM user_saved_items
     WHERE user_id = $1
       AND bucket = $2
       AND content_id = $3
       AND COALESCE(playlist_name, '') = COALESCE($4, '')`,
    [user.sub, input.bucket, input.contentId, input.playlistName ?? null],
  );

  return { removed: (result.rowCount ?? 0) > 0 };
};

export const getMePrivacyOverview = async (user: JwtClaims): Promise<{
  privacy: {
    totalRequests: number;
    latestRequests: Array<{ id: string; type: 'export' | 'delete'; status: string; createdAt: string }>;
    totalPlayEvents: number;
    totalLiveSubscriptions: number;
  };
}> => {
  const [requests, playCount, liveCount] = await Promise.all([
    pool.query<PrivacyRequestRow>(
      `SELECT id, request_type, status, created_at
       FROM privacy_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [user.sub],
    ),
    pool.query<CountRow>(`SELECT COUNT(*)::text AS count FROM user_play_events WHERE user_id = $1`, [user.sub]),
    pool.query<CountRow>(`SELECT COUNT(*)::text AS count FROM live_subscriptions WHERE user_id = $1`, [user.sub]),
  ]);

  return {
    privacy: {
      totalRequests: requests.rowCount ?? requests.rows.length,
      latestRequests: requests.rows.map((row) => ({
        id: row.id,
        type: row.request_type,
        status: row.status,
        createdAt: toIso(row.created_at),
      })),
      totalPlayEvents: Number(playCount.rows[0]?.count ?? '0'),
      totalLiveSubscriptions: Number(liveCount.rows[0]?.count ?? '0'),
    },
  };
};

export const createMePrivacyExportRequest = async (user: JwtClaims, input: { notes?: string }) => {
  const result = await pool.query<{ id: string; status: string; created_at: string | Date }>(
    `INSERT INTO privacy_requests (user_id, request_type, status, payload)
     VALUES ($1, 'export', 'submitted', $2::jsonb)
     RETURNING id, status, created_at`,
    [user.sub, JSON.stringify({ notes: input.notes ?? '' })],
  );

  const row = result.rows[0]!;
  return {
    request: {
      id: row.id,
      type: 'export' as const,
      status: row.status,
      createdAt: toIso(row.created_at),
    },
  };
};

export const resetMeRecommendationSignals = async (user: JwtClaims): Promise<{ clearedPlayEvents: number }> => {
  const result = await pool.query(`DELETE FROM user_play_events WHERE user_id = $1`, [user.sub]);
  return { clearedPlayEvents: result.rowCount ?? 0 };
};

export const createMePrivacyDeleteRequest = async (
  user: JwtClaims,
  input: { fullName: string; confirmText: string; notes?: string },
): Promise<{ request: { id: string; type: 'delete'; status: string; createdAt: string } }> => {
  const profile = await readProfile(user.sub);
  const { config } = await getMobileAppConfig();
  const expectedPhrase = config.privacy.deleteConfirmPhrase.trim().toUpperCase();

  if (input.confirmText.trim().toUpperCase() !== expectedPhrase) {
    throw new HttpError(400, 'Invalid delete confirmation phrase');
  }

  if (profile.display_name.trim().toLowerCase() !== input.fullName.trim().toLowerCase()) {
    throw new HttpError(400, 'Full name does not match account profile');
  }

  const result = await pool.query<{ id: string; status: string; created_at: string | Date }>(
    `INSERT INTO privacy_requests (user_id, request_type, status, payload)
     VALUES ($1, 'delete', 'submitted', $2::jsonb)
     RETURNING id, status, created_at`,
    [user.sub, JSON.stringify({ notes: input.notes ?? '', fullName: input.fullName })],
  );

  const row = result.rows[0]!;
  return {
    request: {
      id: row.id,
      type: 'delete',
      status: row.status,
      createdAt: toIso(row.created_at),
    },
  };
};

export const createMeSupportRequest = async (
  user: JwtClaims,
  input: {
    category: string;
    subject: string;
    message: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, unknown>;
  },
) => {
  const result = await pool.query<{ id: string; status: string; created_at: string | Date }>(
    `INSERT INTO support_requests (user_id, category, subject, message, priority, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, status, created_at`,
    [user.sub, input.category, input.subject, input.message, input.priority ?? 'normal', JSON.stringify(input.metadata ?? {})],
  );

  const row = result.rows[0]!;
  return {
    ticket: {
      id: row.id,
      status: row.status,
      createdAt: toIso(row.created_at),
    },
  };
};

export const createMeRating = async (
  user: JwtClaims,
  input: {
    rating: number;
    comment?: string;
    channel: 'mobile' | 'admin' | 'web';
    metadata?: Record<string, unknown>;
  },
) => {
  const result = await pool.query<{ id: string; created_at: string | Date }>(
    `INSERT INTO app_ratings (user_id, rating, channel, comment, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, created_at`,
    [user.sub, input.rating, input.channel, input.comment ?? null, JSON.stringify(input.metadata ?? {})],
  );

  const row = result.rows[0]!;
  return {
    rating: {
      id: row.id,
      value: input.rating,
      createdAt: toIso(row.created_at),
    },
  };
};

const parseAmountToCents = (amount: string): number => {
  const normalized = amount.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new HttpError(400, 'Invalid amount format');
  }

  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero');
  }
  if (cents > 10_000_000_00) {
    throw new HttpError(400, 'Amount exceeds maximum supported range');
  }

  return cents;
};

const buildDonationInstructions = (params: {
  methodId: string;
  currency: string;
}) => {
  const supportEmail = env.EMAIL_SUPPORT_EMAIL || undefined;
  const currency = params.currency.toUpperCase();
  const method = params.methodId.toLowerCase();

  if (method.includes('bank')) {
    return {
      title: 'Bank transfer instructions',
      message:
        'Use the bank details provided by the ministry team to complete the transfer. Include your donation reference in the narration.',
      actionLabel: supportEmail ? 'Request bank details' : undefined,
      actionUrl: supportEmail ? `mailto:${supportEmail}` : undefined,
    };
  }

  if (currency === 'NGN') {
    return {
      title: 'Secure local payment',
      message:
        'Continue with your preferred local provider. A secure payment link will be issued for your NGN donation.',
      actionLabel: 'Continue to payment',
    };
  }

  return {
    title: 'Secure card payment',
    message:
      'Continue with the secure checkout to complete your donation. You can use card, Apple Pay, or Google Pay where available.',
    actionLabel: 'Continue to payment',
  };
};

const createDonationIntentCore = async (
  userId: string | null,
  input: {
    amount: string;
    mode: 'once' | 'daily' | 'weekly' | 'monthly';
    methodId: string;
    currency?: string;
    planId?: string;
    metadata?: Record<string, unknown>;
  },
) => {
  const amountCents = parseAmountToCents(input.amount);
  const currency = (input.currency ?? 'USD').toUpperCase();
  const instructions = buildDonationInstructions({ methodId: input.methodId, currency });

  const result = await pool.query<{ id: string; status: string; created_at: string | Date }>(
    `INSERT INTO donation_intents (user_id, amount_cents, currency, mode, method_id, status, payload)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6::jsonb)
     RETURNING id, status, created_at`,
    [
      userId,
      amountCents,
      currency,
      input.mode,
      input.methodId,
      JSON.stringify({
        amountLabel: input.amount,
        planId: input.planId ?? null,
        metadata: input.metadata ?? {},
        instructions,
      }),
    ],
  );

  const row = result.rows[0]!;
  return {
    donationIntent: {
      id: row.id,
      status: row.status,
      amountCents,
      currency,
      mode: input.mode,
      methodId: input.methodId,
      createdAt: toIso(row.created_at),
      instructions,
    },
  };
};

export const createMeDonationIntent = async (
  user: JwtClaims,
  input: {
    amount: string;
    mode: 'once' | 'daily' | 'weekly' | 'monthly';
    methodId: string;
    currency?: string;
    planId?: string;
    metadata?: Record<string, unknown>;
  },
) => createDonationIntentCore(user.sub, input);

export const createPublicDonationIntent = async (input: {
  amount: string;
  mode: 'once' | 'daily' | 'weekly' | 'monthly';
  methodId: string;
  currency?: string;
  planId?: string;
  metadata?: Record<string, unknown>;
}) => createDonationIntentCore(null, input);

export const getMeBootstrap = async (user: JwtClaims) => {
  const [profile, preferences, metrics, privacy, library] = await Promise.all([
    getMeProfile(user),
    getMePreferences(user),
    getMeMetrics(user),
    getMePrivacyOverview(user),
    getMeLibrary(user),
  ]);

  return {
    profile: profile.user,
    preferences: preferences.preferences,
    metrics,
    privacy: privacy.privacy,
    library,
  };
};
