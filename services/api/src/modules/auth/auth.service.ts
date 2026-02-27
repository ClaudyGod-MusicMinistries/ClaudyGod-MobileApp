import crypto from 'crypto';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { HttpError } from '../../lib/httpError';
import { emailQueue } from '../../queues/emailQueue';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import type {
  AuthActionResponse,
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationEmailInput,
  ResetPasswordInput,
  SafeUser,
  UserRole,
  VerifyEmailInput,
} from './auth.types';

type AuthTokenType = 'email_verification' | 'password_reset';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string | Date;
  email_verified_at: string | Date | null;
}

interface PublicUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string | Date;
  email_verified_at: string | Date | null;
}

interface AuthTokenRow {
  id: string;
  user_id: string;
}

const ACTION_TOKEN_BYTES = 32;
const AUTH_GENERIC_EMAIL_MESSAGE =
  'If the account exists, an email with next steps has been sent.';

const toIsoDate = (value: string | Date): string => new Date(value).toISOString();
const toIsoDateOrNull = (value: string | Date | null): string | null =>
  value ? toIsoDate(value) : null;

const toSafeUser = (row: PublicUserRow): SafeUser => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  createdAt: toIsoDate(row.created_at),
  emailVerifiedAt: toIsoDateOrNull(row.email_verified_at),
});

const ensureUserScaffold = async (user: SafeUser): Promise<void> => {
  await Promise.all([
    pool.query(
      `INSERT INTO user_profiles (user_id, display_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           updated_at = NOW()`,
      [user.id, user.displayName, user.email],
    ),
    pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id],
    ),
  ]);
};

const tokenHash = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const createRawToken = (): string =>
  crypto.randomBytes(ACTION_TOKEN_BYTES).toString('hex');

const buildActionUrl = (baseUrl: string, token: string): string => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

const buildPublicActionUrl = (path: string, token: string): string => {
  const normalizedBase = env.AUTH_PUBLIC_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return buildActionUrl(`${normalizedBase}${normalizedPath}`, token);
};

const enqueueEmailJob = async ({
  recipients,
  subject,
  textBody,
  htmlBody,
  jobType,
  payload,
}: {
  recipients: string[];
  subject: string;
  textBody: string;
  htmlBody: string;
  jobType: string;
  payload: Record<string, unknown>;
}): Promise<void> => {
  const emailInsert = await pool.query<{ id: number }>(
    `INSERT INTO email_jobs (job_type, recipients, subject, text_body, html_body, status, payload)
     VALUES ($1, $2::text[], $3, $4, $5, 'pending', $6::jsonb)
     RETURNING id`,
    [jobType, recipients, subject, textBody, htmlBody, JSON.stringify(payload)],
  );

  const emailJobId = emailInsert.rows[0]!.id;
  const queueJob = await emailQueue.add(`email.${jobType}`, { emailJobId });

  await pool.query(
    `UPDATE email_jobs
     SET queue_job_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [emailJobId, String(queueJob.id)],
  );
};

const issueAuthActionToken = async ({
  userId,
  tokenType,
  ttlMinutes,
  requestIp,
}: {
  userId: string;
  tokenType: AuthTokenType;
  ttlMinutes: number;
  requestIp?: string;
}): Promise<{ rawToken: string; expiresAt: string }> => {
  await pool.query(
    `UPDATE auth_action_tokens
     SET used_at = NOW(), updated_at = NOW()
     WHERE user_id = $1
       AND token_type = $2
       AND used_at IS NULL`,
    [userId, tokenType],
  );

  const rawToken = createRawToken();
  const hashedToken = tokenHash(rawToken);
  const expiresAtDate = new Date(Date.now() + ttlMinutes * 60_000);

  await pool.query(
    `INSERT INTO auth_action_tokens (user_id, token_hash, token_type, expires_at, requested_ip)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, hashedToken, tokenType, expiresAtDate.toISOString(), requestIp ?? null],
  );

  return {
    rawToken,
    expiresAt: expiresAtDate.toISOString(),
  };
};

const consumeAuthActionToken = async ({
  rawToken,
  tokenType,
}: {
  rawToken: string;
  tokenType: AuthTokenType;
}): Promise<AuthTokenRow> => {
  const hashedToken = tokenHash(rawToken);

  const result = await pool.query<AuthTokenRow>(
    `UPDATE auth_action_tokens
     SET used_at = NOW(), updated_at = NOW()
     WHERE token_hash = $1
       AND token_type = $2
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING id, user_id`,
    [hashedToken, tokenType],
  );

  if (result.rowCount === 0) {
    throw new HttpError(400, 'Invalid or expired token');
  }

  return result.rows[0]!;
};

const enqueueVerificationEmail = async (user: SafeUser, rawToken: string): Promise<void> => {
  const verifyUrl = buildPublicActionUrl(env.AUTH_VERIFY_EMAIL_PATH, rawToken);
  const subject = 'Verify your email address';
  const textBody = [
    `Hi ${user.displayName},`,
    '',
    'Welcome to Claudy Platform.',
    'Please verify your email address to activate your account:',
    verifyUrl,
    '',
    `This link expires in ${env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES} minutes.`,
    'If you did not create this account, you can ignore this email.',
  ].join('\n');
  const htmlBody = `<p>Hi ${user.displayName},</p>
<p>Welcome to Claudy Platform.</p>
<p>Please verify your email address to activate your account:</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>This link expires in ${env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES} minutes.</p>
<p>If you did not create this account, you can ignore this email.</p>`;

  await enqueueEmailJob({
    recipients: [user.email],
    subject,
    textBody,
    htmlBody,
    jobType: 'auth_verify_email',
    payload: {
      userId: user.id,
      type: 'email_verification',
    },
  });
};

const enqueuePasswordResetEmail = async (user: SafeUser, rawToken: string): Promise<void> => {
  const resetUrl = buildPublicActionUrl(env.AUTH_RESET_PASSWORD_PATH, rawToken);
  const subject = 'Reset your password';
  const textBody = [
    `Hi ${user.displayName},`,
    '',
    'We received a request to reset your password.',
    'Use this secure link to set a new password:',
    resetUrl,
    '',
    `This link expires in ${env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes.`,
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');
  const htmlBody = `<p>Hi ${user.displayName},</p>
<p>We received a request to reset your password.</p>
<p>Use this secure link to set a new password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>This link expires in ${env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes.</p>
<p>If you did not request this, you can safely ignore this email.</p>`;

  await enqueueEmailJob({
    recipients: [user.email],
    subject,
    textBody,
    htmlBody,
    jobType: 'auth_password_reset',
    payload: {
      userId: user.id,
      type: 'password_reset',
    },
  });
};

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const requestedRole: UserRole = input.role === 'ADMIN' ? 'ADMIN' : 'CLIENT';

  const existing = await pool.query<{ id: string }>('SELECT id FROM app_users WHERE email = $1 LIMIT 1', [
    email,
  ]);

  if (existing.rowCount && existing.rowCount > 0) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);

  if (requestedRole === 'ADMIN') {
    const providedCode = input.adminSignupCode?.trim();
    if (!env.ADMIN_SIGNUP_CODE) {
      throw new HttpError(403, 'Admin signup is disabled');
    }
    if (!providedCode || providedCode !== env.ADMIN_SIGNUP_CODE) {
      throw new HttpError(403, 'Invalid admin signup code');
    }
  }

  const emailVerifiedAt = requestedRole === 'ADMIN' ? new Date().toISOString() : null;

  const result = await pool.query<PublicUserRow>(
    `INSERT INTO app_users (email, password_hash, display_name, role, email_verified_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, display_name, role, created_at, email_verified_at`,
    [email, passwordHash, displayName, requestedRole, emailVerifiedAt],
  );

  const user = toSafeUser(result.rows[0]!);
  await ensureUserScaffold(user);

  if (user.role === 'CLIENT' && !user.emailVerifiedAt) {
    const verificationToken = await issueAuthActionToken({
      userId: user.id,
      tokenType: 'email_verification',
      ttlMinutes: env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES,
    });
    await enqueueVerificationEmail(user, verificationToken.rawToken);
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  });

  return {
    accessToken,
    user,
    requiresEmailVerification: user.role === 'CLIENT' && !user.emailVerifiedAt,
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const email = input.email.trim().toLowerCase();

  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, role, is_active, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const userRow = result.rows[0]!;

  if (!userRow.is_active) {
    throw new HttpError(403, 'Account is inactive');
  }

  const isValidPassword = await verifyPassword(input.password, userRow.password_hash);

  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const safeUser = toSafeUser(userRow);

  if (
    env.AUTH_REQUIRE_EMAIL_VERIFICATION &&
    safeUser.role === 'CLIENT' &&
    !safeUser.emailVerifiedAt
  ) {
    throw new HttpError(
      403,
      'Email is not verified. Please check your inbox for the verification link.',
    );
  }

  await Promise.all([
    ensureUserScaffold(safeUser),
    pool.query(`UPDATE app_users SET last_login_at = NOW() WHERE id = $1`, [safeUser.id]),
  ]);

  const accessToken = signAccessToken({
    sub: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    displayName: safeUser.displayName,
  });

  return {
    accessToken,
    user: safeUser,
  };
};

export const verifyEmail = async (input: VerifyEmailInput): Promise<AuthResponse> => {
  const tokenUse = await consumeAuthActionToken({
    rawToken: input.token.trim(),
    tokenType: 'email_verification',
  });

  const userUpdate = await pool.query<PublicUserRow>(
    `UPDATE app_users
     SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, display_name, role, created_at, email_verified_at`,
    [tokenUse.user_id],
  );

  if (userUpdate.rowCount === 0) {
    throw new HttpError(404, 'User not found');
  }

  const user = toSafeUser(userUpdate.rows[0]!);
  await ensureUserScaffold(user);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  });

  return {
    accessToken,
    user,
    requiresEmailVerification: false,
  };
};

export const resendVerificationEmail = async (
  input: ResendVerificationEmailInput,
  requestIp?: string,
): Promise<AuthActionResponse> => {
  const email = input.email.trim().toLowerCase();

  const result = await pool.query<PublicUserRow>(
    `SELECT id, email, display_name, role, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    return { message: AUTH_GENERIC_EMAIL_MESSAGE };
  }

  const user = toSafeUser(result.rows[0]!);

  if (user.emailVerifiedAt) {
    return { message: AUTH_GENERIC_EMAIL_MESSAGE };
  }

  const verificationToken = await issueAuthActionToken({
    userId: user.id,
    tokenType: 'email_verification',
    ttlMinutes: env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES,
    requestIp,
  });
  await enqueueVerificationEmail(user, verificationToken.rawToken);

  return { message: AUTH_GENERIC_EMAIL_MESSAGE };
};

export const requestPasswordReset = async (
  input: ForgotPasswordInput,
  requestIp?: string,
): Promise<AuthActionResponse> => {
  const email = input.email.trim().toLowerCase();

  const result = await pool.query<PublicUserRow>(
    `SELECT id, email, display_name, role, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    return { message: AUTH_GENERIC_EMAIL_MESSAGE };
  }

  const user = toSafeUser(result.rows[0]!);
  const resetToken = await issueAuthActionToken({
    userId: user.id,
    tokenType: 'password_reset',
    ttlMinutes: env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES,
    requestIp,
  });
  await enqueuePasswordResetEmail(user, resetToken.rawToken);

  return { message: AUTH_GENERIC_EMAIL_MESSAGE };
};

export const resetPassword = async (input: ResetPasswordInput): Promise<AuthActionResponse> => {
  const tokenUse = await consumeAuthActionToken({
    rawToken: input.token.trim(),
    tokenType: 'password_reset',
  });

  const nextPasswordHash = await hashPassword(input.newPassword);

  await pool.query(
    `UPDATE app_users
     SET password_hash = $2, updated_at = NOW()
     WHERE id = $1`,
    [tokenUse.user_id, nextPasswordHash],
  );

  await pool.query(
    `UPDATE auth_action_tokens
     SET used_at = COALESCE(used_at, NOW()), updated_at = NOW()
     WHERE user_id = $1
       AND token_type = 'password_reset'
       AND used_at IS NULL`,
    [tokenUse.user_id],
  );

  return { message: 'Password updated successfully.' };
};

export const getUserById = async (userId: string): Promise<SafeUser> => {
  const result = await pool.query<PublicUserRow>(
    `SELECT id, email, display_name, role, created_at, email_verified_at
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'User not found');
  }

  return toSafeUser(result.rows[0]!);
};
