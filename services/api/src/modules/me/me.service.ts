import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { getMobileAppConfig } from '../appConfig/appConfig.service';

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

const toIso = (value: string | Date): string => new Date(value).toISOString();

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

  return getMeProfile(user);
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

export const createMeDonationIntent = async (
  user: JwtClaims,
  input: {
    amount: string;
    mode: 'once' | 'monthly';
    methodId: string;
    currency?: string;
    planId?: string;
    metadata?: Record<string, unknown>;
  },
) => {
  const amountCents = parseAmountToCents(input.amount);
  const currency = (input.currency ?? 'USD').toUpperCase();

  const result = await pool.query<{ id: string; status: string; created_at: string | Date }>(
    `INSERT INTO donation_intents (user_id, amount_cents, currency, mode, method_id, status, payload)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6::jsonb)
     RETURNING id, status, created_at`,
    [
      user.sub,
      amountCents,
      currency,
      input.mode,
      input.methodId,
      JSON.stringify({
        amountLabel: input.amount,
        planId: input.planId ?? null,
        metadata: input.metadata ?? {},
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
    },
  };
};

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
