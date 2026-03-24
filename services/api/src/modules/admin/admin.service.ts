import type { JwtClaims } from '../../utils/jwt';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { emailTransportInfo, verifyEmailTransport } from '../../infra/email';
import { queueEmailJob } from '../../infra/transactionalEmails';
import { HttpError } from '../../lib/httpError';
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import type { UserRole } from '../auth/auth.types';

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

interface AuthSummaryRow {
  pending_signups: string;
  login_success_last_7_days: string;
  login_failures_last_7_days: string;
  verifications_last_7_days: string;
  password_resets_last_30_days: string;
}

interface RecentUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
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

interface RecentAuthActivityRow {
  id: string;
  user_id: string | null;
  email: string | null;
  event_key: string;
  status: 'success' | 'failure' | 'info';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
  display_name: string | null;
}

interface EmailSummaryRow {
  pending_jobs: string;
  processing_jobs: string;
  completed_last_24_hours: string;
  failed_last_24_hours: string;
  total_last_7_days: string;
}

interface RecentEmailJobRow {
  id: string;
  job_type: string;
  template_key: string | null;
  recipients: string[] | string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
  created_at: string | Date;
  processed_at: string | Date | null;
}

const toIso = (value: string | Date): string => new Date(value).toISOString();
const toIsoOrNull = (value: string | Date | null): string | null =>
  value ? toIso(value) : null;

const humanizeToken = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toRecipients = (recipients: string[] | string): string[] =>
  Array.isArray(recipients)
    ? recipients
    : String(recipients)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const toAdminRecentUser = (row: RecentUserRow) => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  authProvider: row.auth_provider,
  createdAt: toIso(row.created_at),
  lastLoginAt: row.last_login_at ? toIso(row.last_login_at) : null,
  emailVerifiedAt: row.email_verified_at ? toIso(row.email_verified_at) : null,
});

const getEmailDeliverySummaryResult = () =>
  pool.query<EmailSummaryRow>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_jobs,
       COUNT(*) FILTER (WHERE status = 'processing')::text AS processing_jobs,
       COUNT(*) FILTER (
         WHERE status = 'completed'
           AND created_at >= NOW() - INTERVAL '24 hours'
       )::text AS completed_last_24_hours,
       COUNT(*) FILTER (
         WHERE status = 'failed'
           AND created_at >= NOW() - INTERVAL '24 hours'
       )::text AS failed_last_24_hours,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS total_last_7_days
     FROM email_jobs`,
  );

const getRecentEmailJobsResult = (limit: number) =>
  pool.query<RecentEmailJobRow>(
    `SELECT
       id::text,
       job_type,
       template_key,
       recipients,
       status,
       error,
       created_at,
       processed_at
     FROM email_jobs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );

async function safeQueryRows<T>(queryPromise: Promise<{ rows: T[] }>, fallbackRows: T[]): Promise<{ rows: T[] }> {
  try {
    return await queryPromise;
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return { rows: fallbackRows };
    }
    throw error;
  }
}

const DEFAULT_SUMMARY_ROW: SummaryRow = {
  total_users: '0',
  new_users_last_7_days: '0',
  verified_users: '0',
  admin_users: '0',
  client_users: '0',
};

const DEFAULT_CONTENT_SUMMARY_ROW: ContentSummaryRow = {
  published_content: '0',
  draft_content: '0',
};

const DEFAULT_RATING_SUMMARY_ROW: RatingSummaryRow = {
  total_feedback: '0',
  average_rating: null,
};

const DEFAULT_REQUEST_SUMMARY_ROW: RequestSummaryRow = {
  open_support_requests: '0',
  active_privacy_requests: '0',
};

const DEFAULT_AUTH_SUMMARY_ROW: AuthSummaryRow = {
  pending_signups: '0',
  login_success_last_7_days: '0',
  login_failures_last_7_days: '0',
  verifications_last_7_days: '0',
  password_resets_last_30_days: '0',
};

const DEFAULT_EMAIL_SUMMARY_ROW: EmailSummaryRow = {
  pending_jobs: '0',
  processing_jobs: '0',
  completed_last_24_hours: '0',
  failed_last_24_hours: '0',
  total_last_7_days: '0',
};

export const getAdminDashboard = async () => {
  const [
    userSummary,
    contentSummary,
    ratingSummary,
    requestSummary,
    authSummary,
    recentUsers,
    feedback,
    supportInbox,
    signupTrend,
    automationRuns,
    recentAuthActivity,
    emailSummary,
    recentEmailJobs,
  ] =
    await Promise.all([
      safeQueryRows(
        pool.query<SummaryRow>(
        `SELECT
           COUNT(*)::text AS total_users,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS new_users_last_7_days,
           COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL)::text AS verified_users,
           COUNT(*) FILTER (WHERE role = 'ADMIN')::text AS admin_users,
           COUNT(*) FILTER (WHERE role = 'CLIENT')::text AS client_users
         FROM app_users`,
      ),
        [DEFAULT_SUMMARY_ROW],
      ),
      safeQueryRows(
        pool.query<ContentSummaryRow>(
        `SELECT
           COUNT(*) FILTER (WHERE visibility = 'published')::text AS published_content,
           COUNT(*) FILTER (WHERE visibility = 'draft')::text AS draft_content
         FROM content_items`,
      ),
        [DEFAULT_CONTENT_SUMMARY_ROW],
      ),
      safeQueryRows(
        pool.query<RatingSummaryRow>(
        `SELECT
           COUNT(*)::text AS total_feedback,
           ROUND(AVG(rating)::numeric, 2)::text AS average_rating
         FROM app_ratings`,
      ),
        [DEFAULT_RATING_SUMMARY_ROW],
      ),
      safeQueryRows(
        pool.query<RequestSummaryRow>(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('open', 'in_progress'))::text AS open_support_requests,
           (SELECT COUNT(*)::text FROM privacy_requests WHERE status IN ('submitted', 'processing')) AS active_privacy_requests
         FROM support_requests`,
      ),
        [DEFAULT_REQUEST_SUMMARY_ROW],
      ),
      safeQueryRows(
        pool.query<AuthSummaryRow>(
          `SELECT
             (SELECT COUNT(*)::text FROM pending_signups WHERE expires_at > NOW()) AS pending_signups,
             COUNT(*) FILTER (
               WHERE event_key = 'login_success'
                 AND created_at >= NOW() - INTERVAL '7 days'
             )::text AS login_success_last_7_days,
             COUNT(*) FILTER (
               WHERE event_key IN ('login_failed', 'login_unverified')
                 AND created_at >= NOW() - INTERVAL '7 days'
             )::text AS login_failures_last_7_days,
             COUNT(*) FILTER (
               WHERE event_key = 'verification_completed'
                 AND created_at >= NOW() - INTERVAL '7 days'
             )::text AS verifications_last_7_days,
             COUNT(*) FILTER (
               WHERE event_key = 'password_reset_completed'
                 AND created_at >= NOW() - INTERVAL '30 days'
             )::text AS password_resets_last_30_days
           FROM auth_activity_events`,
        ),
        [DEFAULT_AUTH_SUMMARY_ROW],
      ),
      safeQueryRows(
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
        [],
      ),
      safeQueryRows(
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
        [],
      ),
      safeQueryRows(
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
        [],
      ),
      safeQueryRows(
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
        [],
      ),
      safeQueryRows(
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
        .catch((error) => {
          if (isMissingDatabaseStructureError(error)) {
            return { rows: [] as AutomationRunRow[] };
          }
          throw error;
        }),
        [],
      ),
      safeQueryRows(
        pool.query<RecentAuthActivityRow>(
          `SELECT
             e.id::text,
             e.user_id,
             e.email,
             e.event_key,
             e.status,
             e.ip_address,
             e.user_agent,
             e.metadata,
             e.created_at,
             u.display_name
           FROM auth_activity_events e
           LEFT JOIN app_users u ON u.id = e.user_id
           ORDER BY e.created_at DESC
           LIMIT 12`,
        ),
        [],
      ),
      safeQueryRows(getEmailDeliverySummaryResult(), [DEFAULT_EMAIL_SUMMARY_ROW]),
      safeQueryRows(getRecentEmailJobsResult(8), []),
    ]);

  const summary = userSummary.rows[0]!;
  const content = contentSummary.rows[0]!;
  const ratings = ratingSummary.rows[0]!;
  const requests = requestSummary.rows[0]!;
  const auth = authSummary.rows[0]!;
  const emailDelivery = emailSummary.rows[0]!;

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
    Number(auth.login_failures_last_7_days) >= Math.max(10, Number(auth.login_success_last_7_days))
      ? {
          id: 'auth-friction',
          tone: 'warning',
          title: 'Sign-in friction is elevated',
          detail: `${auth.login_failures_last_7_days} unsuccessful sign-in attempts were recorded in the last 7 days. Review password UX, verification flow, and support guidance.`,
        }
      : null,
    Number(auth.pending_signups) >= 5
      ? {
          id: 'pending-signups',
          tone: 'info',
          title: 'Pending signups are accumulating',
          detail: `${auth.pending_signups} account(s) are waiting on email verification. Review delivery timing and onboarding clarity.`,
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
          detail: 'Add YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in the root .env.development or .env.production file to fetch and import channel videos.',
        }
      : null,
    !env.SMTP_ENABLED
      ? {
          id: 'smtp-config',
          tone: 'info',
          title: 'Email automation is not configured',
          detail: 'Set Brevo SMTP credentials and related mail settings to enable verification, onboarding, security alerts, and scheduled outreach.',
        }
      : null,
    Number(emailDelivery.failed_last_24_hours) > 0
      ? {
          id: 'email-delivery-failures',
          tone: 'warning',
          title: 'Transactional email delivery needs attention',
          detail: `${emailDelivery.failed_last_24_hours} email job(s) failed in the last 24 hours. Review email diagnostics, worker logs, and Postfix relay status before inviting more users.`,
        }
      : null,
    Number(emailDelivery.pending_jobs) > 10
      ? {
          id: 'email-delivery-backlog',
          tone: 'info',
          title: 'Email queue is building up',
          detail: `${emailDelivery.pending_jobs} email job(s) are still waiting to be delivered. Verify that the worker and relay are both healthy.`,
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
      pendingSignups: Number(auth.pending_signups),
      loginSuccessLast7Days: Number(auth.login_success_last_7_days),
      loginFailuresLast7Days: Number(auth.login_failures_last_7_days),
      verificationsLast7Days: Number(auth.verifications_last_7_days),
      passwordResetsLast30Days: Number(auth.password_resets_last_30_days),
      totalFeedback: Number(ratings.total_feedback),
      averageRating: ratings.average_rating ? Number(ratings.average_rating) : null,
    },
    authFunnel: {
      pendingSignups: Number(auth.pending_signups),
      loginSuccessLast7Days: Number(auth.login_success_last_7_days),
      loginFailuresLast7Days: Number(auth.login_failures_last_7_days),
      verificationsLast7Days: Number(auth.verifications_last_7_days),
      passwordResetsLast30Days: Number(auth.password_resets_last_30_days),
    },
    emailDelivery: {
      smtpEnabled: emailTransportInfo.enabled,
      providerLabel: env.SMTP_PROVIDER_LABEL,
      provider: emailTransportInfo.provider,
      host: emailTransportInfo.host,
      port: emailTransportInfo.port,
      pendingJobs: Number(emailDelivery.pending_jobs),
      processingJobs: Number(emailDelivery.processing_jobs),
      completedLast24Hours: Number(emailDelivery.completed_last_24_hours),
      failedLast24Hours: Number(emailDelivery.failed_last_24_hours),
      totalLast7Days: Number(emailDelivery.total_last_7_days),
      recentJobs: recentEmailJobs.rows.map((row) => ({
        id: row.id,
        jobType: row.job_type,
        templateKey: row.template_key,
        recipients: toRecipients(row.recipients),
        status: row.status,
        error: row.error,
        createdAt: toIso(row.created_at),
        processedAt: toIsoOrNull(row.processed_at),
      })),
    },
    recentUsers: recentUsers.rows.map(toAdminRecentUser),
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
    recentAuthActivity: recentAuthActivity.rows.map((row) => ({
      id: row.id,
      eventKey: row.event_key,
      label: humanizeToken(row.event_key),
      status: row.status,
      createdAt: toIso(row.created_at),
      email: row.email ?? '',
      ipAddress: row.ip_address ?? '',
      userAgent: row.user_agent ?? '',
      metadata: row.metadata ?? {},
      user: row.user_id
        ? {
            id: row.user_id,
            displayName: row.display_name ?? 'Unknown user',
            email: row.email ?? '',
          }
        : null,
    })),
  };
};

export const getAdminEmailDiagnostics = async () => {
  const [emailSummary, recentEmailJobs, transportCheck] = await Promise.all([
    safeQueryRows(getEmailDeliverySummaryResult(), [DEFAULT_EMAIL_SUMMARY_ROW]),
    safeQueryRows(getRecentEmailJobsResult(20), []),
    verifyEmailTransport(),
  ]);

  const summary = emailSummary.rows[0]!;

  return {
    generatedAt: new Date().toISOString(),
    transport: {
      ...emailTransportInfo,
      providerLabel: env.SMTP_PROVIDER_LABEL,
      reachable: transportCheck.reachable,
      reason: transportCheck.reason ?? null,
    },
    summary: {
      pendingJobs: Number(summary.pending_jobs),
      processingJobs: Number(summary.processing_jobs),
      completedLast24Hours: Number(summary.completed_last_24_hours),
      failedLast24Hours: Number(summary.failed_last_24_hours),
      totalLast7Days: Number(summary.total_last_7_days),
    },
    recentJobs: recentEmailJobs.rows.map((row) => ({
      id: row.id,
      jobType: row.job_type,
      templateKey: row.template_key,
      recipients: toRecipients(row.recipients),
      status: row.status,
      error: row.error,
      createdAt: toIso(row.created_at),
      processedAt: toIsoOrNull(row.processed_at),
    })),
  };
};

export const sendAdminTestEmail = async (input: {
  recipient: string;
  actor: JwtClaims;
}) => {
  const recipient = input.recipient.trim().toLowerCase();
  const subject = `${env.EMAIL_BRAND_NAME} email delivery check`;
  const textBody = [
    `This is a transactional email test from ${env.EMAIL_BRAND_NAME}.`,
    '',
    `Requested by: ${input.actor.displayName} <${input.actor.email}>`,
    `Recipient: ${recipient}`,
    `Generated at: ${new Date().toISOString()}`,
    '',
    'If you received this message, the API, worker, and relay pipeline are handing off mail successfully.',
  ].join('\n');
  const htmlBody = `<p>This is a transactional email test from <strong>${escapeHtml(
    env.EMAIL_BRAND_NAME,
  )}</strong>.</p><ul><li><strong>Requested by:</strong> ${escapeHtml(
    input.actor.displayName,
  )} &lt;${escapeHtml(input.actor.email)}&gt;</li><li><strong>Recipient:</strong> ${escapeHtml(
    recipient,
  )}</li><li><strong>Generated at:</strong> ${escapeHtml(new Date().toISOString())}</li></ul><p>If you received this message, the API, worker, and relay pipeline are handing off mail successfully.</p>`;

  await queueEmailJob({
    recipients: [recipient],
    subject,
    textBody,
    htmlBody,
    jobType: 'admin_email_test',
    templateKey: 'admin.email-test',
    payload: {
      requestedByUserId: input.actor.sub,
      requestedByEmail: input.actor.email,
      recipient,
    },
  });

  return {
    queued: true,
    recipient,
    message: 'Test email queued successfully.',
  };
};

export const updateAdminUserRole = async (input: {
  userId: string;
  role: UserRole;
  actor: JwtClaims;
}) => {
  if (input.userId === input.actor.sub) {
    throw new HttpError(400, 'You cannot change your own role from the dashboard');
  }

  const existingResult = await pool.query<RecentUserRow>(
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
     WHERE id = $1
     LIMIT 1`,
    [input.userId],
  );

  if (existingResult.rowCount === 0) {
    throw new HttpError(404, 'User not found');
  }

  const existing = existingResult.rows[0]!;

  if (existing.role === input.role) {
    return {
      user: toAdminRecentUser(existing),
      message: 'Role already matches the selected value.',
    };
  }

  if (existing.role === 'ADMIN' && input.role !== 'ADMIN') {
    const adminCountResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM app_users
       WHERE role = 'ADMIN'`,
    );

    if (Number(adminCountResult.rows[0]?.count || 0) <= 1) {
      throw new HttpError(400, 'At least one admin user must remain assigned');
    }
  }

  const updatedResult = await pool.query<RecentUserRow>(
    `UPDATE app_users
     SET role = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       email,
       display_name,
       role,
       auth_provider,
       created_at,
       last_login_at,
       email_verified_at`,
    [input.userId, input.role],
  );

  return {
    user: toAdminRecentUser(updatedResult.rows[0]!),
    message: `User role updated to ${input.role}.`,
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
