import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import {
  queuePasswordResetEmail,
  queueVerificationEmail,
  queueWelcomeEmail,
} from '../../infra/transactionalEmails';
import { HttpError } from '../../lib/httpError';
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import { revokeAllUserSessions } from './authSession.service';
import type {
  AuthActionResponse,
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  ResendVerificationEmailInput,
  ResetPasswordInput,
  SafeUser,
  UserRole,
  VerifyEmailInput,
} from './auth.types';

type AuthTokenType = 'email_verification' | 'password_reset';

interface QueryRunner {
  query: PoolClient['query'];
}

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

interface PendingSignupRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
}

interface PendingPasswordResetRow {
  id: string;
  user_id: string;
  email: string;
}

interface AuthRequestContext {
  requestIp?: string;
  userAgent?: string;
}

const ACTION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_CODE_LENGTH = 6;
const AUTH_GENERIC_EMAIL_MESSAGE =
  'If the account exists, an email with next steps has been sent.';
const PENDING_VERIFICATION_MESSAGE =
  'We sent a 6-digit verification code to your email. Enter it to finish creating your account.';

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

const ensureUserScaffold = async (user: SafeUser, runner: QueryRunner = pool): Promise<void> => {
  await Promise.all([
    runner.query(
      `INSERT INTO user_profiles (user_id, display_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           updated_at = NOW()`,
      [user.id, user.displayName, user.email],
    ),
    runner.query(
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

const createVerificationCode = (): string =>
  crypto.randomInt(0, 10 ** EMAIL_VERIFICATION_CODE_LENGTH)
    .toString()
    .padStart(EMAIL_VERIFICATION_CODE_LENGTH, '0');

const isOtpCode = (token: string): boolean =>
  new RegExp(`^\\d{${EMAIL_VERIFICATION_CODE_LENGTH}}$`).test(token);

const buildAccessToken = (user: SafeUser): string =>
  signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  });

const buildPendingRegisterResponse = (email: string, message = PENDING_VERIFICATION_MESSAGE): RegisterResponse => ({
  requiresEmailVerification: true,
  pendingEmail: email,
  message,
});

const recordAuthActivity = async (params: {
  userId?: string | null;
  email?: string | null;
  eventKey: string;
  status?: 'success' | 'failure' | 'info';
  requestIp?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO auth_activity_events (user_id, email, event_key, status, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        params.userId ?? null,
        params.email?.trim().toLowerCase() ?? null,
        params.eventKey,
        params.status ?? 'info',
        params.requestIp ?? null,
        params.userAgent ?? null,
        JSON.stringify(params.metadata ?? {}),
      ],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return;
    }
    throw error;
  }
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

const createLocalUser = async ({
  email,
  passwordHash,
  displayName,
  role,
  emailVerifiedAt,
  runner = pool,
}: {
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  runner?: QueryRunner;
}): Promise<SafeUser> => {
  const result = await runner.query<PublicUserRow>(
    `INSERT INTO app_users (email, password_hash, display_name, role, email_verified_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, display_name, role, created_at, email_verified_at`,
    [email, passwordHash, displayName, role, emailVerifiedAt],
  );

  const user = toSafeUser(result.rows[0]!);
  await ensureUserScaffold(user, runner);
  return user;
};

const issuePendingSignupCode = async ({
  email,
  passwordHash,
  displayName,
  role,
  requestIp,
}: {
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  requestIp?: string;
}): Promise<{ verificationCode: string; expiresAt: string }> => {
  const verificationCode = createVerificationCode();
  const hashedCode = tokenHash(verificationCode);
  const expiresAtDate = new Date(Date.now() + env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES * 60_000);

  await pool.query(
    `INSERT INTO pending_signups (email, password_hash, display_name, role, otp_hash, expires_at, requested_ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         otp_hash = EXCLUDED.otp_hash,
         expires_at = EXCLUDED.expires_at,
         requested_ip = EXCLUDED.requested_ip,
         updated_at = NOW()`,
    [
      email,
      passwordHash,
      displayName,
      role,
      hashedCode,
      expiresAtDate.toISOString(),
      requestIp ?? null,
    ],
  );

  return {
    verificationCode,
    expiresAt: expiresAtDate.toISOString(),
  };
};

const issuePendingPasswordResetCode = async ({
  userId,
  email,
  requestIp,
}: {
  userId: string;
  email: string;
  requestIp?: string;
}): Promise<{ resetCode: string; expiresAt: string }> => {
  const resetCode = createVerificationCode();
  const hashedCode = tokenHash(resetCode);
  const expiresAtDate = new Date(Date.now() + env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000);

  await pool.query(
    `INSERT INTO pending_password_resets (user_id, email, otp_hash, expires_at, requested_ip)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
     SET email = EXCLUDED.email,
         otp_hash = EXCLUDED.otp_hash,
         expires_at = EXCLUDED.expires_at,
         requested_ip = EXCLUDED.requested_ip,
         updated_at = NOW()`,
    [userId, email, hashedCode, expiresAtDate.toISOString(), requestIp ?? null],
  );

  return {
    resetCode,
    expiresAt: expiresAtDate.toISOString(),
  };
};

const completePendingSignup = async ({
  email,
  verificationCode,
}: {
  email: string;
  verificationCode: string;
}): Promise<SafeUser> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pendingResult = await client.query<PendingSignupRow>(
      `DELETE FROM pending_signups
       WHERE email = $1
         AND otp_hash = $2
         AND expires_at > NOW()
       RETURNING id, email, password_hash, display_name, role`,
      [email, tokenHash(verificationCode)],
    );

    if (pendingResult.rowCount === 0) {
      throw new HttpError(400, 'Invalid or expired verification code');
    }

    const pendingSignup = pendingResult.rows[0]!;
    const existingUser = await client.query<PublicUserRow & { id: string }>(
      `SELECT id, email, display_name, role, created_at, email_verified_at
       FROM app_users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    let userRow: PublicUserRow;
    if ((existingUser.rowCount ?? 0) > 0) {
      const updatedUser = await client.query<PublicUserRow>(
        `UPDATE app_users
         SET password_hash = $2,
             display_name = $3,
             role = $4,
             email_verified_at = COALESCE(email_verified_at, NOW()),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, display_name, role, created_at, email_verified_at`,
        [
          existingUser.rows[0]!.id,
          pendingSignup.password_hash,
          pendingSignup.display_name,
          pendingSignup.role,
        ],
      );
      userRow = updatedUser.rows[0]!;
    } else {
      const insertedUser = await client.query<PublicUserRow>(
        `INSERT INTO app_users (email, password_hash, display_name, role, email_verified_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, email, display_name, role, created_at, email_verified_at`,
        [
          pendingSignup.email,
          pendingSignup.password_hash,
          pendingSignup.display_name,
          pendingSignup.role,
        ],
      );
      userRow = insertedUser.rows[0]!;
    }

    const safeUser = toSafeUser(userRow);
    await ensureUserScaffold(safeUser, client);

    await client.query('COMMIT');
    return safeUser;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const completePendingPasswordReset = async ({
  email,
  resetCode,
  newPassword,
}: {
  email: string;
  resetCode: string;
  newPassword: string;
}): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pendingResult = await client.query<PendingPasswordResetRow>(
      `DELETE FROM pending_password_resets
       WHERE email = $1
         AND otp_hash = $2
         AND expires_at > NOW()
       RETURNING id, user_id, email`,
      [email, tokenHash(resetCode)],
    );

    if (pendingResult.rowCount === 0) {
      throw new HttpError(400, 'Invalid or expired reset code');
    }

    const pendingReset = pendingResult.rows[0]!;
    const nextPasswordHash = await hashPassword(newPassword);

    await client.query(
      `UPDATE app_users
       SET password_hash = $2, updated_at = NOW()
       WHERE id = $1`,
      [pendingReset.user_id, nextPasswordHash],
    );

    await client.query(
      `UPDATE auth_action_tokens
       SET used_at = COALESCE(used_at, NOW()), updated_at = NOW()
       WHERE user_id = $1
         AND token_type = 'password_reset'
         AND used_at IS NULL`,
      [pendingReset.user_id],
    );

    await client.query(
      `UPDATE auth_refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW()),
           updated_at = NOW()
       WHERE user_id = $1
         AND revoked_at IS NULL`,
      [pendingReset.user_id],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const registerUser = async (
  input: RegisterInput,
  context: AuthRequestContext = {},
): Promise<AuthResponse | RegisterResponse> => {
  const email = input.email.trim().toLowerCase();
  const displayName = input.username.trim();
  const requestedRole: UserRole = input.role === 'ADMIN' ? 'ADMIN' : 'CLIENT';

  const existing = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, role, is_active, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (requestedRole === 'ADMIN') {
    const providedCode = input.adminSignupCode?.trim();
    if (!env.ADMIN_SIGNUP_CODE) {
      throw new HttpError(403, 'Admin signup is disabled');
    }
    if (!providedCode || providedCode !== env.ADMIN_SIGNUP_CODE) {
      throw new HttpError(403, 'Invalid admin signup code');
    }
  }

  if ((existing.rowCount ?? 0) > 0) {
    const existingUser = existing.rows[0]!;
    if (
      requestedRole === 'CLIENT' &&
      env.AUTH_REQUIRE_EMAIL_VERIFICATION &&
      existingUser.role === 'CLIENT' &&
      !existingUser.email_verified_at
    ) {
      const verificationToken = await issueAuthActionToken({
        userId: existingUser.id,
        tokenType: 'email_verification',
        ttlMinutes: env.AUTH_VERIFICATION_TOKEN_TTL_MINUTES,
        requestIp: context.requestIp,
      });
      await queueVerificationEmail(
        {
          id: existingUser.id,
          email: existingUser.email,
          displayName: existingUser.display_name,
        },
        { rawToken: verificationToken.rawToken },
      );

      return buildPendingRegisterResponse(
        email,
        'This email already has a pending account. We sent fresh verification instructions.',
      );
    }

    await recordAuthActivity({
      userId: existingUser.id,
      email,
      eventKey: 'register_conflict',
      status: 'failure',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { requestedRole },
    });

    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);

  if (requestedRole === 'CLIENT' && env.AUTH_REQUIRE_EMAIL_VERIFICATION) {
    const pendingSignup = await issuePendingSignupCode({
      email,
      passwordHash,
      displayName,
      role: requestedRole,
      requestIp: context.requestIp,
    });

    await queueVerificationEmail(
      {
        id: `pending:${email}`,
        email,
        displayName,
      },
      { verificationCode: pendingSignup.verificationCode },
    );

    await recordAuthActivity({
      email,
      eventKey: 'register_pending',
      status: 'success',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { requestedRole },
    });

    return buildPendingRegisterResponse(email);
  }

  const emailVerifiedAt = new Date().toISOString();
  const user = await createLocalUser({
    email,
    passwordHash,
    displayName,
    role: requestedRole,
    emailVerifiedAt,
  });

  await queueWelcomeEmail({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  await recordAuthActivity({
    userId: user.id,
    email: user.email,
    eventKey: 'register_completed',
    status: 'success',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
    metadata: { requestedRole, immediateAccess: true },
  });

  return {
    accessToken: buildAccessToken(user),
    user,
    requiresEmailVerification: false,
  };
};

export const loginUser = async (input: LoginInput, context: AuthRequestContext = {}): Promise<AuthResponse> => {
  const email = input.email.trim().toLowerCase();

  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, role, is_active, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    const pending = await pool.query<{ email: string }>(
      `SELECT email
       FROM pending_signups
       WHERE email = $1
         AND expires_at > NOW()
       LIMIT 1`,
      [email],
    );

    if ((pending.rowCount ?? 0) > 0) {
      await recordAuthActivity({
        email,
        eventKey: 'login_unverified',
        status: 'failure',
        requestIp: context.requestIp,
        userAgent: context.userAgent,
      });
      throw new HttpError(
        403,
        'Email is not verified. Enter the 6-digit code sent to your email to finish creating your account.',
      );
    }

    await recordAuthActivity({
      email,
      eventKey: 'login_failed',
      status: 'failure',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { reason: 'user_not_found' },
    });
    throw new HttpError(401, 'Invalid credentials');
  }

  const userRow = result.rows[0]!;

  if (!userRow.is_active) {
    await recordAuthActivity({
      userId: userRow.id,
      email,
      eventKey: 'login_failed',
      status: 'failure',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { reason: 'inactive' },
    });
    throw new HttpError(403, 'Account is inactive');
  }

  const isValidPassword = await verifyPassword(input.password, userRow.password_hash);

  if (!isValidPassword) {
    await recordAuthActivity({
      userId: userRow.id,
      email,
      eventKey: 'login_failed',
      status: 'failure',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { reason: 'invalid_password' },
    });
    throw new HttpError(401, 'Invalid credentials');
  }

  const safeUser = toSafeUser(userRow);

  if (
    env.AUTH_REQUIRE_EMAIL_VERIFICATION &&
    safeUser.role === 'CLIENT' &&
    !safeUser.emailVerifiedAt
  ) {
    await recordAuthActivity({
      userId: safeUser.id,
      email: safeUser.email,
      eventKey: 'login_unverified',
      status: 'failure',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
    });
    throw new HttpError(
      403,
      'Email is not verified. Enter the 6-digit code sent to your email or request a new verification email.',
    );
  }

  await Promise.all([
    ensureUserScaffold(safeUser),
    pool.query(`UPDATE app_users SET last_login_at = NOW() WHERE id = $1`, [safeUser.id]),
    recordAuthActivity({
      userId: safeUser.id,
      email: safeUser.email,
      eventKey: 'login_success',
      status: 'success',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
    }),
  ]);

  return {
    accessToken: buildAccessToken(safeUser),
    user: safeUser,
  };
};

export const verifyEmail = async (input: VerifyEmailInput, context: AuthRequestContext = {}): Promise<AuthResponse> => {
  const submittedToken = input.token.trim();

  if (isOtpCode(submittedToken)) {
    const email = input.email?.trim().toLowerCase();
    if (!email) {
      throw new HttpError(400, 'Email is required when verifying with a code');
    }

    const user = await completePendingSignup({
      email,
      verificationCode: submittedToken,
    });

    await queueWelcomeEmail({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    await recordAuthActivity({
      userId: user.id,
      email: user.email,
      eventKey: 'verification_completed',
      status: 'success',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { method: 'otp' },
    });

    return {
      accessToken: buildAccessToken(user),
      user,
      requiresEmailVerification: false,
    };
  }

  const tokenUse = await consumeAuthActionToken({
    rawToken: submittedToken,
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
  await queueWelcomeEmail({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  await recordAuthActivity({
    userId: user.id,
    email: user.email,
    eventKey: 'verification_completed',
    status: 'success',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
    metadata: { method: 'token' },
  });

  return {
    accessToken: buildAccessToken(user),
    user,
    requiresEmailVerification: false,
  };
};

export const resendVerificationEmail = async (
  input: ResendVerificationEmailInput,
  context: AuthRequestContext = {},
): Promise<AuthActionResponse> => {
  const email = input.email.trim().toLowerCase();

  const pendingResult = await pool.query<PendingSignupRow>(
    `SELECT id, email, password_hash, display_name, role
     FROM pending_signups
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if ((pendingResult.rowCount ?? 0) > 0) {
    const pendingSignup = pendingResult.rows[0]!;
    const pendingCode = await issuePendingSignupCode({
      email: pendingSignup.email,
      passwordHash: pendingSignup.password_hash,
      displayName: pendingSignup.display_name,
      role: pendingSignup.role,
      requestIp: context.requestIp,
    });

    await queueVerificationEmail(
      {
        id: pendingSignup.id,
        email: pendingSignup.email,
        displayName: pendingSignup.display_name,
      },
      { verificationCode: pendingCode.verificationCode },
    );

    await recordAuthActivity({
      email: pendingSignup.email,
      eventKey: 'verification_requested',
      status: 'success',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { target: 'pending_signup' },
    });

    return { message: AUTH_GENERIC_EMAIL_MESSAGE };
  }

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
    requestIp: context.requestIp,
  });
  await queueVerificationEmail(
    {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    { rawToken: verificationToken.rawToken },
  );

  await recordAuthActivity({
    userId: user.id,
    email: user.email,
    eventKey: 'verification_requested',
    status: 'success',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
    metadata: { target: 'existing_user' },
  });

  return { message: AUTH_GENERIC_EMAIL_MESSAGE };
};

export const requestPasswordReset = async (
  input: ForgotPasswordInput,
  context: AuthRequestContext = {},
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
  const pendingReset = await issuePendingPasswordResetCode({
    userId: user.id,
    email: user.email,
    requestIp: context.requestIp,
  });
  await queuePasswordResetEmail(
    {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    { resetCode: pendingReset.resetCode },
  );

  await recordAuthActivity({
    userId: user.id,
    email: user.email,
    eventKey: 'password_reset_requested',
    status: 'success',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
  });

  return { message: AUTH_GENERIC_EMAIL_MESSAGE };
};

export const resetPassword = async (input: ResetPasswordInput, context: AuthRequestContext = {}): Promise<AuthActionResponse> => {
  const submittedToken = input.token.trim();

  if (isOtpCode(submittedToken)) {
    const email = input.email?.trim().toLowerCase();
    if (!email) {
      throw new HttpError(400, 'Email is required when resetting with a code');
    }

    await completePendingPasswordReset({
      email,
      resetCode: submittedToken,
      newPassword: input.newPassword,
    });

    await recordAuthActivity({
      email,
      eventKey: 'password_reset_completed',
      status: 'success',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { method: 'otp' },
    });

    return { message: 'Password updated successfully.' };
  }

  const tokenUse = await consumeAuthActionToken({
    rawToken: submittedToken,
    tokenType: 'password_reset',
  });

  const nextPasswordHash = await hashPassword(input.newPassword);

  await pool.query(
    `UPDATE app_users
     SET password_hash = $2, updated_at = NOW()
     WHERE id = $1`,
    [tokenUse.user_id, nextPasswordHash],
  );

  await revokeAllUserSessions(tokenUse.user_id);

  await pool.query(
    `UPDATE auth_action_tokens
     SET used_at = COALESCE(used_at, NOW()), updated_at = NOW()
     WHERE user_id = $1
       AND token_type = 'password_reset'
       AND used_at IS NULL`,
    [tokenUse.user_id],
  );

  await recordAuthActivity({
    userId: tokenUse.user_id,
    eventKey: 'password_reset_completed',
    status: 'success',
    requestIp: context.requestIp,
    userAgent: context.userAgent,
    metadata: { method: 'token' },
  });

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
