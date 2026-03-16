import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';

interface SummaryRow {
  total_users: string;
  new_users_last_7_days: string;
  verified_users: string;
  admin_users: string;
  client_users: string;
}

interface ContentSummaryRow {
  published_content: string;
  draft_content: string;
}

interface RatingSummaryRow {
  total_feedback: string;
  average_rating: string | null;
}

interface RequestSummaryRow {
  open_support_requests: string;
  active_privacy_requests: string;
}

interface RecentUserRow {
  id: string;
  email: string;
  display_name: string;
  role: 'CLIENT' | 'ADMIN';
  auth_provider: 'local' | 'supabase';
  created_at: string | Date;
  last_login_at: string | Date | null;
  email_verified_at: string | Date | null;
}

interface FeedbackRow {
  id: string;
  rating: number;
  channel: 'mobile' | 'admin' | 'web';
  comment: string | null;
  created_at: string | Date;
  user_id: string | null;
  display_name: string | null;
  email: string | null;
}

interface SupportRow {
  id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string | Date;
  user_id: string | null;
  display_name: string | null;
  email: string | null;
}

interface SignupTrendRow {
  day: string;
  signups: string;
}

interface AutomationRunRow {
  id: string;
  run_type: string;
  scope: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary: Record<string, unknown> | null;
  notes: string | null;
  created_at: string | Date;
  actor_display_name: string | null;
  actor_email: string | null;
}

const toIso = (value: string | Date): string => new Date(value).toISOString();

const humanizeToken = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getAdminDashboard = async () => {
  const [userSummary, contentSummary, ratingSummary, requestSummary, recentUsers, feedback, supportInbox, signupTrend, automationRuns] =
    await Promise.all([
      pool.query<SummaryRow>(
        `SELECT
           COUNT(*)::text AS total_users,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS new_users_last_7_days,
           COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::text AS verified_users,
           COUNT(*) FILTER (WHERE role = 'ADMIN')::text AS admin_users,
           COUNT(*) FILTER (WHERE role = 'CLIENT')::text AS client_users
         FROM app_users`,
      ),
      pool.query<ContentSummaryRow>(
        `SELECT
           COUNT(*) FILTER (WHERE visibility = 'published')::text AS published_content,
           COUNT(*) FILTER (WHERE visibility = 'draft')::text AS draft_content
         FROM content_items`,
      ),
      pool.query<RatingSummaryRow>(
        `SELECT
           COUNT(*)::text AS total_feedback,
           ROUND(AVG(rating)::numeric, 2)::text AS average_rating
         FROM app_ratings`,
      ),
      pool.query<RequestSummaryRow>(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('open', 'in_progress'))::text AS open_support_requests,
           (SELECT COUNT(*)::text FROM privacy_requests WHERE status IN ('submitted', 'processing')) AS active_privacy_requests
         FROM support_requests`,
      ),
      pool.query<RecentUserRow>(
        `SELECT
           id,
           email,
           display_name,
           role,
           auth_provider,
           created_at,
           last_login_at,
           email_verified_at
         FROM app_users
         ORDER BY created_at DESC
         LIMIT 10`,
      ),
      pool.query<FeedbackRow>(
        `SELECT
           r.id,
           r.rating,
           r.channel,
           r.comment,
           r.created_at,
           u.id AS user_id,
           u.display_name,
           u.email
         FROM app_ratings r
         LEFT JOIN app_users u ON u.id = r.user_id
         ORDER BY r.created_at DESC
         LIMIT 10`,
      ),
      pool.query<SupportRow>(
        `SELECT
           s.id,
           s.status,
           s.category,
           s.subject,
           s.message,
           s.priority,
           s.created_at,
           u.id AS user_id,
           u.display_name,
           u.email
         FROM support_requests s
         LEFT JOIN app_users u ON u.id = s.user_id
         ORDER BY
           CASE s.status
             WHEN 'open' THEN 0
             WHEN 'in_progress' THEN 1
             WHEN 'resolved' THEN 2
             ELSE 3
           END,
           s.created_at DESC
         LIMIT 12`,
      ),
      pool.query<SignupTrendRow>(
        `WITH days AS (
           SELECT generate_series(
             date_trunc('day', NOW()) - INTERVAL '13 days',
             date_trunc('day', NOW()),
             INTERVAL '1 day'
           ) AS day
         )
         SELECT
           to_char(days.day, 'YYYY-MM-DD') AS day,
           COUNT(u.id)::text AS signups
         FROM days
         LEFT JOIN app_users u
           ON date_trunc('day', u.created_at) = days.day
         GROUP BY days.day
         ORDER BY days.day ASC`,
      ),
      pool
        .query<AutomationRunRow>(
          `SELECT
             r.id::text,
             r.run_type,
             r.scope,
             r.status,
             r.summary,
             r.notes,
             r.created_at,
             u.display_name AS actor_display_name,
             u.email AS actor_email
           FROM automation_runs r
           LEFT JOIN app_users u ON u.id = r.actor_user_id
           ORDER BY r.created_at DESC
           LIMIT 8`,
        )
        .catch(() => ({ rows: [] as AutomationRunRow[] })),
    ]);

  const summary = userSummary.rows[0]!;
  const content = contentSummary.rows[0]!;
  const ratings = ratingSummary.rows[0]!;
  const requests = requestSummary.rows[0]!;

  const smartInsights = [
    summary.new_users_last_7_days === '0'
      ? {
          id: 'growth-followup',
          tone: 'warning',
          title: 'Account growth is quiet',
          detail: 'No new users were recorded in the last 7 days. Publish fresh media and promote sign-up links before launch.',
        }
      : null,
    Number(requests.open_support_requests) >= 5
      ? {
          id: 'support-backlog',
          tone: 'warning',
          title: 'Support backlog needs attention',
          detail: `${requests.open_support_requests} complaint tickets are open or in progress. Resolve them before expanding traffic.`,
        }
      : null,
    Number(content.draft_content) > Number(content.published_content)
      ? {
          id: 'draft-backlog',
          tone: 'info',
          title: 'Draft backlog is higher than live content',
          detail: 'Your editorial queue is healthy, but more content is waiting than published. Review drafts and schedule releases.',
        }
      : null,
    !env.YOUTUBE_ENABLED
      ? {
          id: 'youtube-config',
          tone: 'warning',
          title: 'YouTube sync is not configured',
          detail: 'Add YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in services/api/.env to fetch and import channel videos.',
        }
      : null,
    !env.SMTP_ENABLED
      ? {
          id: 'smtp-config',
          tone: 'info',
          title: 'Email automation is not configured',
          detail: 'Set SMTP_HOST and related credentials to enable verification, alerts, and scheduled outreach.',
        }
      : null,
    Number(ratings.total_feedback) > 0 && ratings.average_rating && Number(ratings.average_rating) < 4
      ? {
          id: 'rating-health',
          tone: 'warning',
          title: 'Audience sentiment needs review',
          detail: `Average rating is ${ratings.average_rating}/5. Review recent feedback and fix the highest-friction screens first.`,
        }
      : {
          id: 'launch-readiness',
          tone: 'success',
          title: 'Core launch signals are stable',
          detail: 'Content, audience, and support metrics do not show a critical blocker right now. Continue structured testing.',
        },
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalUsers: Number(summary.total_users),
      newUsersLast7Days: Number(summary.new_users_last_7_days),
      verifiedUsers: Number(summary.verified_users),
      adminUsers: Number(summary.admin_users),
      clientUsers: Number(summary.client_users),
      publishedContent: Number(content.published_content),
      draftContent: Number(content.draft_content),
      openSupportRequests: Number(requests.open_support_requests),
      activePrivacyRequests: Number(requests.active_privacy_requests),
      totalFeedback: Number(ratings.total_feedback),
      averageRating: ratings.average_rating ? Number(ratings.average_rating) : null,
    },
    recentUsers: recentUsers.rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      authProvider: row.auth_provider,
      createdAt: toIso(row.created_at),
      lastLoginAt: row.last_login_at ? toIso(row.last_login_at) : null,
      emailVerifiedAt: row.email_verified_at ? toIso(row.email_verified_at) : null,
    })),
    feedback: feedback.rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      channel: row.channel,
      comment: row.comment ?? '',
      createdAt: toIso(row.created_at),
      user: row.user_id
        ? {
            id: row.user_id,
            displayName: row.display_name ?? 'Unknown user',
            email: row.email ?? '',
          }
        : null,
    })),
    supportInbox: supportInbox.rows.map((row) => ({
      id: row.id,
      status: row.status,
      category: row.category,
      subject: row.subject,
      message: row.message,
      priority: row.priority,
      createdAt: toIso(row.created_at),
      user: row.user_id
        ? {
            id: row.user_id,
            displayName: row.display_name ?? 'Unknown user',
            email: row.email ?? '',
          }
        : null,
    })),
    signupTrend: signupTrend.rows.map((row) => ({
      day: row.day,
      signups: Number(row.signups),
    })),
    smartInsights,
    recentAutomation: automationRuns.rows.map((row) => ({
      id: row.id,
      runType: row.run_type,
      scope: row.scope,
      status: row.status,
      summary: row.summary ?? {},
      notes: row.notes ?? '',
      createdAt: toIso(row.created_at),
      actor: row.actor_display_name || row.actor_email
        ? {
            displayName: row.actor_display_name ?? 'Unknown user',
            email: row.actor_email ?? '',
          }
        : null,
      label: humanizeToken(row.run_type),
    })),
  };
};

export const updateAdminSupportRequestStatus = async (input: {
  requestId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}) => {
  const result = await pool.query<{ id: string }>(
    `UPDATE support_requests
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [input.requestId, input.status],
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new HttpError(404, 'Support request not found');
  }

  return { updated: true, id: input.requestId, status: input.status };
};
