import { pool } from '../db/pool';
import { emailQueue } from '../queues/emailQueue';
import { env } from '../config/env';
import {
  buildPasswordResetTemplate,
  buildProfileUpdatedTemplate,
  buildVerifyEmailTemplate,
  buildWelcomeEmailTemplate,
} from './emailTemplates';

interface EmailJobInput {
  recipients: string[];
  subject: string;
  textBody: string;
  htmlBody: string;
  jobType: string;
  templateKey: string;
  payload: Record<string, unknown>;
}

interface AppEmailUser {
  id: string;
  email: string;
  displayName: string;
}

const appendQueryParams = (
  baseUrl: string,
  params: Record<string, string | undefined>,
): string => {
  const query = Object.entries(params).filter(([, value]) => typeof value === 'string' && value.length > 0);
  if (query.length === 0) {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  const search = query
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`)
    .join('&');

  return `${baseUrl}${separator}${search}`;
};

const buildPublicActionUrl = (
  path: string,
  params: Record<string, string | undefined> = {},
): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBase = env.AUTH_PUBLIC_BASE_URL.trim().replace(/\/+$/, '');

  if (!normalizedBase) {
    return appendQueryParams(normalizedPath, params);
  }

  const absoluteUrl = `${normalizedBase}${normalizedPath}`;

  return appendQueryParams(absoluteUrl, params);
};

export const queueEmailJob = async (input: EmailJobInput): Promise<void> => {
  const emailInsert = await pool.query<{ id: number }>(
    `INSERT INTO email_jobs (
       provider, template_key, job_type, recipients, subject, text_body, html_body, status, payload
     )
     VALUES ($1, $2, $3, $4::text[], $5, $6, $7, 'pending', $8::jsonb)
     RETURNING id`,
    [
      env.SMTP_PROVIDER,
      input.templateKey,
      input.jobType,
      input.recipients,
      input.subject,
      input.textBody,
      input.htmlBody,
      JSON.stringify(input.payload),
    ],
  );

  const emailJobId = emailInsert.rows[0]!.id;
  const queueJob = await emailQueue.add(`email.${input.jobType}`, { emailJobId });

  await pool.query(
    `UPDATE email_jobs
     SET queue_job_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [emailJobId, String(queueJob.id)],
  );
};

export const queueVerificationEmail = async (
  user: AppEmailUser,
  input: {
    rawToken?: string;
    verificationCode?: string;
  },
): Promise<void> => {
  const verifyUrl = buildPublicActionUrl(env.AUTH_VERIFY_EMAIL_PATH, {
    email: user.email,
    token: input.rawToken,
  });
  const template = buildVerifyEmailTemplate({
    displayName: user.displayName,
    verifyUrl,
    verificationCode: input.verificationCode,
    expiresInMinutes: env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES,
  });

  await queueEmailJob({
    recipients: [user.email],
    subject: template.subject,
    textBody: template.text,
    htmlBody: template.html,
    jobType: 'auth_verify_email',
    templateKey: 'auth.verify-email',
    payload: {
      userId: user.id,
      actionUrl: verifyUrl,
      email: user.email,
      type: 'email_verification',
    },
  });
};

export const queueWelcomeEmail = async (user: AppEmailUser): Promise<void> => {
  const signInUrl = buildPublicActionUrl(env.AUTH_SIGN_IN_PATH);
  const template = buildWelcomeEmailTemplate({
    displayName: user.displayName,
    signInUrl,
  });

  await queueEmailJob({
    recipients: [user.email],
    subject: template.subject,
    textBody: template.text,
    htmlBody: template.html,
    jobType: 'auth_welcome_email',
    templateKey: 'auth.welcome',
    payload: {
      userId: user.id,
      actionUrl: signInUrl,
      type: 'welcome',
    },
  });
};

export const queuePasswordResetEmail = async (
  user: AppEmailUser,
  input: {
    rawToken?: string;
    resetCode?: string;
  },
): Promise<void> => {
  const resetUrl = buildPublicActionUrl(env.AUTH_RESET_PASSWORD_PATH, {
    email: user.email,
    token: input.rawToken,
  });
  const template = buildPasswordResetTemplate({
    displayName: user.displayName,
    resetUrl,
    resetCode: input.resetCode,
    expiresInMinutes: env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES,
  });

  await queueEmailJob({
    recipients: [user.email],
    subject: template.subject,
    textBody: template.text,
    htmlBody: template.html,
    jobType: 'auth_password_reset',
    templateKey: 'auth.password-reset',
    payload: {
      userId: user.id,
      actionUrl: resetUrl,
      type: 'password_reset',
    },
  });
};

export const queueProfileUpdatedEmail = async (input: {
  user: AppEmailUser;
  changedFields: string[];
}): Promise<void> => {
  const reviewUrl = buildPublicActionUrl(env.AUTH_ACCOUNT_REVIEW_PATH);
  const template = buildProfileUpdatedTemplate({
    displayName: input.user.displayName,
    reviewUrl,
    changedFields: input.changedFields,
  });

  await queueEmailJob({
    recipients: [input.user.email],
    subject: template.subject,
    textBody: template.text,
    htmlBody: template.html,
    jobType: 'account_profile_updated',
    templateKey: 'account.profile-updated',
    payload: {
      userId: input.user.id,
      actionUrl: reviewUrl,
      changedFields: input.changedFields,
      type: 'profile_updated',
    },
  });
};
