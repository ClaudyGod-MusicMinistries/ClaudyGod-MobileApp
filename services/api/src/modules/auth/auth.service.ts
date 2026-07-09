import { createHash, randomBytes, randomInt } from 'crypto';
import type { UserTier } from './auth.types';
import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import {
  queuePasswordResetEmail,
  queueVerificationEmail,
  queueWelcomeEmail,
} from '../../infra/transactionalEmails';
import { createLogger } from '../../lib/logger';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors';
import { ensureUserScaffold } from '../../lib/userScaffold';

const log = createLogger('auth');
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import { revokeAllUserSessions } from './authSession.service';
import {
  checkAccountLocked,
  clearFailedLogins,
  recordFailedLogin,
  recordSecurityEvent,
} from './accountSecurity.service';
import { validateMfaCode } from './mfa.service';
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

type AuthTokenType = 'email_verification' | 'password_reset' | 'mfa_step_up';

interface QueryRunner {
  query: PoolClient['query'];
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  tier: string;
  mfa_enabled: boolean;
  is_active: boolean;
  created_at: string | Date;
  email_verified_at: string | Date | null;
}

interface PublicUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  tier: string;
  mfa_enabled: boolean;
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
  tier: (row.tier ?? 'free') as UserTier,
  mfaEnabled: row.mfa_enabled ?? false,
  createdAt: toIsoDate(row.created_at),
  emailVerifiedAt: toIsoDateOrNull(row.email_verified_at),
});

const tokenHash = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const createRawToken = (): string =>
  randomBytes(ACTION_TOKEN_BYTES).toString('hex');

const createVerificationCode = (): string =>
  randomInt(0, 10 ** EMAIL_VERIFICATION_CODE_LENGTH)
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
    tier: user.tier,
    mfaEnabled: user.mfaEnabled,
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
    throw new BadRequestError('Invalid or expired token', 'AUTH_TOKEN_INVALID', 'token');
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
  await ensureUserScaffold(user.id, user.displayName, user.email, runner);
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
      throw new BadRequestError('Invalid or expired verification code', 'AUTH_INVALID_OTP', 'token');
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
    await ensureUserScaffold(safeUser.id, safeUser.displayName, safeUser.email, client);

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
      throw new BadRequestError('Invalid or expired reset code', 'AUTH_INVALID_RESET', 'token');
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

  // Roles a caller may self-assign via signup code. SUPER_ADMIN is deliberately excluded —
  // it must only ever be granted through the invite flow, never a shared-code self-signup.
  const CODE_GATED_ROLES: readonly UserRole[] = ['ADMIN', 'MODERATOR', 'CREATOR'];

  let requestedRole: UserRole;
  if (!input.role || input.role === 'CLIENT') {
    requestedRole = 'CLIENT';
  } else if (CODE_GATED_ROLES.includes(input.role)) {
    requestedRole = input.role;
  } else {
    throw new ForbiddenError(
      `Self-registration is not permitted for role ${input.role}`,
      'AUTH_ROLE_NOT_SELF_REGISTERABLE',
    );
  }

  const existing = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, role, is_active, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (CODE_GATED_ROLES.includes(requestedRole)) {
    const providedCode = input.adminSignupCode?.trim();
    if (!env.ADMIN_SIGNUP_CODE) {
      throw new ForbiddenError('Admin signup is disabled', 'AUTH_ADMIN_DISABLED');
    }
    if (!providedCode || providedCode !== env.ADMIN_SIGNUP_CODE) {
      throw new ForbiddenError('Invalid admin signup code', 'AUTH_ADMIN_CODE_INVALID');
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

    throw new ConflictError('Email is already registered', 'AUTH_EMAIL_TAKEN', 'email');
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
    `SELECT id, email, password_hash, display_name, role,
            COALESCE(tier, 'free') AS tier,
            COALESCE(mfa_enabled, FALSE) AS mfa_enabled,
            is_active, created_at, email_verified_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    const pending = await pool.query<{ email: string }>(
      `SELECT email FROM pending_signups WHERE email = $1 AND expires_at > NOW() LIMIT 1`,
      [email],
    );

    if ((pending.rowCount ?? 0) > 0) {
      await recordAuthActivity({
        email, eventKey: 'login_unverified', status: 'failure',
        requestIp: context.requestIp, userAgent: context.userAgent,
      });
      throw new ForbiddenError(
        'Email is not verified. Enter the 6-digit code sent to your email to finish creating your account.',
        'AUTH_EMAIL_NOT_VERIFIED',
      );
    }

    await recordAuthActivity({
      email, eventKey: 'login_failed', status: 'failure',
      requestIp: context.requestIp, userAgent: context.userAgent,
      metadata: { reason: 'user_not_found' },
    });
    throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  const userRow = result.rows[0]!;

  if (!userRow.is_active) {
    await recordAuthActivity({
      userId: userRow.id, email, eventKey: 'login_failed', status: 'failure',
      requestIp: context.requestIp, userAgent: context.userAgent,
      metadata: { reason: 'inactive' },
    });
    throw new ForbiddenError('Account is inactive', 'AUTH_INACTIVE');
  }

  await checkAccountLocked(userRow.id);

  const isValidPassword = await verifyPassword(input.password, userRow.password_hash);

  if (!isValidPassword) {
    const { isLocked } = await recordFailedLogin(
      userRow.id,
      context.requestIp ?? null,
      context.userAgent ?? null,
    );
    await recordAuthActivity({
      userId: userRow.id, email, eventKey: 'login_failed', status: 'failure',
      requestIp: context.requestIp, userAgent: context.userAgent,
      metadata: { reason: 'invalid_password', locked: isLocked },
    });
    if (isLocked) {
      throw new UnauthorizedError(
        `Too many failed attempts. Account temporarily locked for ${env.ACCOUNT_LOCKOUT_DURATION_MINUTES} minutes.`,
        'ACCOUNT_LOCKED',
      );
    }
    throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  const safeUser = toSafeUser(userRow);

  if (
    env.AUTH_REQUIRE_EMAIL_VERIFICATION &&
    safeUser.role === 'CLIENT' &&
    !safeUser.emailVerifiedAt
  ) {
    await recordAuthActivity({
      userId: safeUser.id, email: safeUser.email,
      eventKey: 'login_unverified', status: 'failure',
      requestIp: context.requestIp, userAgent: context.userAgent,
    });
    throw new ForbiddenError(
      'Email is not verified. Enter the 6-digit code sent to your email or request a new verification email.',
      'AUTH_EMAIL_NOT_VERIFIED',
    );
  }

  if (safeUser.mfaEnabled) {
    if (!input.mfaCode) {
      const mfaToken = randomBytes(32).toString('hex');
      await pool.query(
        `INSERT INTO auth_action_tokens (user_id, token_hash, token_type, expires_at)
         VALUES ($1, $2, 'mfa_step_up', NOW() + INTERVAL '10 minutes')`,
        [safeUser.id, tokenHash(mfaToken)],
      );
      return {
        accessToken: '',
        user: safeUser,
        mfaRequired: true,
        mfaToken,
        message: 'MFA verification required',
      };
    }

    const isMfaValid = await validateMfaCode(safeUser.id, input.mfaCode);
    if (!isMfaValid) {
      await recordSecurityEvent(safeUser.id, 'login_mfa_failed', {
        ip: context.requestIp, userAgent: context.userAgent,
      });
      throw new UnauthorizedError('Invalid MFA code', 'MFA_INVALID_CODE');
    }
  }

  await Promise.all([
    clearFailedLogins(userRow.id),
    ensureUserScaffold(safeUser.id, safeUser.displayName, safeUser.email),
    pool.query(`UPDATE app_users SET last_login_at = NOW() WHERE id = $1`, [safeUser.id]),
    recordAuthActivity({
      userId: safeUser.id, email: safeUser.email,
      eventKey: 'login_success', status: 'success',
      requestIp: context.requestIp, userAgent: context.userAgent,
    }),
    recordSecurityEvent(safeUser.id, 'login_success', {
      ip: context.requestIp, userAgent: context.userAgent,
    }),
  ]);

  return {
    accessToken: buildAccessToken(safeUser),
    user: safeUser,
  };
};

export const verifyMfaLogin = async (
  input: { mfaToken: string; code: string },
  context: AuthRequestContext = {},
): Promise<Pick<AuthResponse, 'user' | 'message'>> => {
  const { user_id: userId } = await consumeAuthActionToken({
    rawToken: input.mfaToken,
    tokenType: 'mfa_step_up',
  });

  const isMfaValid = await validateMfaCode(userId, input.code);
  if (!isMfaValid) {
    await recordSecurityEvent(userId, 'login_mfa_failed', {
      ip: context.requestIp, userAgent: context.userAgent,
    });
    throw new UnauthorizedError('Invalid MFA code', 'MFA_INVALID_CODE');
  }

  const safeUser = await getUserById(userId);

  await Promise.all([
    clearFailedLogins(userId),
    pool.query(`UPDATE app_users SET last_login_at = NOW() WHERE id = $1`, [userId]),
    recordAuthActivity({
      userId: safeUser.id, email: safeUser.email,
      eventKey: 'login_success', status: 'success',
      requestIp: context.requestIp, userAgent: context.userAgent,
    }),
    recordSecurityEvent(safeUser.id, 'login_success', {
      ip: context.requestIp, userAgent: context.userAgent,
    }),
  ]);

  return { user: safeUser };
};

export const verifyEmail = async (input: VerifyEmailInput, context: AuthRequestContext = {}): Promise<AuthResponse> => {
  const submittedToken = (input.code ?? input.token ?? '').trim();
  if (!submittedToken) {
    throw new BadRequestError('Verification code or token is required', 'AUTH_MISSING_OTP', 'code');
  }

  if (isOtpCode(submittedToken)) {
    let email = input.email?.trim().toLowerCase();
    if (!email) {
      const pendingLookup = await pool.query<{ email: string }>(
        `SELECT email
         FROM pending_signups
         WHERE otp_hash = $1
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [tokenHash(submittedToken)],
      );
      if (pendingLookup.rowCount === 0) {
        await recordAuthActivity({
          eventKey: 'verification_failed',
          status: 'failure',
          requestIp: context.requestIp,
          userAgent: context.userAgent,
          metadata: { method: 'otp_lookup', reason: 'invalid_code' },
        });
        throw new BadRequestError('Invalid or expired verification code', 'AUTH_INVALID_OTP', 'token');
      }
      email = pendingLookup.rows[0]!.email;
      await recordAuthActivity({
        email,
        eventKey: 'verification_lookup',
        status: 'info',
        requestIp: context.requestIp,
        userAgent: context.userAgent,
        metadata: { method: 'otp_lookup' },
      });
    }

    const user = await completePendingSignup({
      email,
      verificationCode: submittedToken,
    });

    try {
      await queueWelcomeEmail({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      });
    } catch (error) {
      log.error('Welcome email enqueue failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
        email: user.email,
      });
    }

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
    throw new NotFoundError('User not found', 'AUTH_USER_NOT_FOUND');
  }

  const user = toSafeUser(userUpdate.rows[0]!);
  await ensureUserScaffold(user.id, user.displayName, user.email);
  try {
    await queueWelcomeEmail({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
    log.error('Welcome email enqueue failed', {
      error: error instanceof Error ? error.message : String(error),
      userId: user.id,
      email: user.email,
    });
  }

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
      throw new BadRequestError('Email is required when resetting with a code', 'AUTH_EMAIL_REQUIRED', 'email');
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
    throw new NotFoundError('User not found', 'AUTH_USER_NOT_FOUND');
  }

  return toSafeUser(result.rows[0]!);
};

// ── Admin Invite Token ──────────────────────────────────────────────────────

interface AdminInvitationRow {
  id: string;
  email: string;
  role: string;
  invited_by: string | null;
  token_hash: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  inviter_name: string | null;
}

export interface AdminInviteDetails {
  id: string;
  email: string;
  role: string;
  inviterName: string | null;
  expiresAt: string;
}

export interface AdminInviteListItem {
  id: string;
  email: string;
  role: string;
  inviterName: string | null;
  expiresAt: string;
  createdAt: string;
}

export const createAdminInviteToken = async (input: {
  email: string;
  role: string;
  invitedBy: string;
}): Promise<{ rawToken: string; id: string; expiresAt: Date }> => {
  const email = input.email.trim().toLowerCase();
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const ttlHours = env.ADMIN_INVITE_TTL_HOURS;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM admin_invitations
     WHERE email = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [email],
  );
  if ((existing.rowCount ?? 0) > 0) {
    await pool.query(
      `UPDATE admin_invitations SET revoked_at = NOW() WHERE id = $1`,
      [existing.rows[0]!.id],
    );
  }

  const result = await pool.query<{ id: string }>(
    `INSERT INTO admin_invitations (email, role, invited_by, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [email, input.role, input.invitedBy, tokenHash, expiresAt.toISOString()],
  );

  return { rawToken, id: result.rows[0]!.id, expiresAt };
};

export const validateAdminInviteToken = async (rawToken: string): Promise<AdminInviteDetails> => {
  const tokenHash = createHash('sha256').update(rawToken.trim()).digest('hex');

  const result = await pool.query<AdminInvitationRow>(
    `SELECT ai.id, ai.email, ai.role, ai.invited_by, ai.expires_at,
            ai.accepted_at, ai.revoked_at, ai.created_at,
            u.display_name AS inviter_name
     FROM admin_invitations ai
     LEFT JOIN app_users u ON u.id = ai.invited_by
     WHERE ai.token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );

  if ((result.rowCount ?? 0) === 0) throw new NotFoundError('Invitation not found or already used', 'INVITE_NOT_FOUND');
  const row = result.rows[0]!;
  if (row.accepted_at) throw new BadRequestError('This invitation has already been used', 'INVITE_USED');
  if (row.revoked_at) throw new BadRequestError('This invitation has been revoked', 'INVITE_REVOKED');
  if (new Date(row.expires_at) < new Date()) throw new BadRequestError('This invitation has expired', 'INVITE_EXPIRED');

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    inviterName: row.inviter_name,
    expiresAt: row.expires_at,
  };
};

export const acceptAdminInvite = async (
  input: { token: string; name: string; displayName: string; password: string },
  context: AuthRequestContext = {},
): Promise<AuthResponse> => {
  const rawToken = input.token.trim();
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inviteResult = await client.query<AdminInvitationRow>(
      `SELECT id, email, role, expires_at, accepted_at, revoked_at
       FROM admin_invitations
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash],
    );

    if ((inviteResult.rowCount ?? 0) === 0) throw new NotFoundError('Invitation not found', 'INVITE_NOT_FOUND');
    const inv = inviteResult.rows[0]!;
    if (inv.accepted_at) throw new BadRequestError('Invitation already used', 'INVITE_USED');
    if (inv.revoked_at) throw new BadRequestError('Invitation was revoked', 'INVITE_REVOKED');
    if (new Date(inv.expires_at) < new Date()) throw new BadRequestError('Invitation has expired', 'INVITE_EXPIRED');

    const email = inv.email;
    const existingUser = await client.query<{ id: string }>(
      `SELECT id FROM app_users WHERE email = $1 LIMIT 1`,
      [email],
    );
    if ((existingUser.rowCount ?? 0) > 0) throw new ConflictError('This email is already registered', 'AUTH_EMAIL_TAKEN', 'email');

    const passwordHash = await hashPassword(input.password);
    const displayName = (input.displayName.trim() || input.name.trim()) || email.split('@')[0]!;

    const userResult = await client.query<{ id: string }>(
      `INSERT INTO app_users (email, password_hash, display_name, role, email_verified_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [email, passwordHash, displayName, inv.role],
    );
    const userId = userResult.rows[0]!.id;

    await client.query(
      `UPDATE admin_invitations SET accepted_at = NOW() WHERE id = $1`,
      [inv.id],
    );

    await client.query('COMMIT');

    const userRow = await pool.query<PublicUserRow>(
      `SELECT id, email, display_name, role, created_at, email_verified_at
       FROM app_users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const safeUser = toSafeUser(userRow.rows[0]!);

    await ensureUserScaffold(safeUser.id, safeUser.displayName, safeUser.email).catch(() => undefined);
    await queueWelcomeEmail({ id: safeUser.id, email: safeUser.email, displayName: safeUser.displayName });

    await recordAuthActivity({
      userId: safeUser.id,
      email: safeUser.email,
      eventKey: 'register_completed',
      status: 'success',
      requestIp: context.requestIp,
      userAgent: context.userAgent,
      metadata: { method: 'invite', role: inv.role },
    });

    return { accessToken: buildAccessToken(safeUser), user: safeUser, requiresEmailVerification: false };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
};

export const listAdminInvitations = async (): Promise<AdminInviteListItem[]> => {
  const result = await pool.query<AdminInvitationRow>(
    `SELECT ai.id, ai.email, ai.role, ai.expires_at, ai.created_at,
            u.display_name AS inviter_name
     FROM admin_invitations ai
     LEFT JOIN app_users u ON u.id = ai.invited_by
     WHERE ai.accepted_at IS NULL AND ai.revoked_at IS NULL AND ai.expires_at > NOW()
     ORDER BY ai.created_at DESC`,
  );
  return result.rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    inviterName: r.inviter_name,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }));
};

export const revokeAdminInvitation = async (inviteId: string): Promise<void> => {
  const result = await pool.query(
    `UPDATE admin_invitations
     SET revoked_at = NOW()
     WHERE id = $1 AND accepted_at IS NULL AND revoked_at IS NULL`,
    [inviteId],
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new NotFoundError('Invitation not found or already resolved', 'INVITE_NOT_FOUND');
  }
};

// ── Admin Access Requests ────────────────────────────────────────────────────

export interface AdminAccessRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
}

export const createAccessRequest = async (input: {
  name: string;
  email: string;
  role: string;
  message?: string;
}): Promise<{ id: string }> => {
  const email = input.email.trim().toLowerCase();

  // Prevent duplicate pending requests from the same email.
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM admin_access_requests
     WHERE email = $1 AND status = 'pending'
     LIMIT 1`,
    [email],
  );
  if ((existing.rowCount ?? 0) > 0) {
    // Return silently — don't expose that a request already exists.
    return { id: existing.rows[0]!.id };
  }

  const result = await pool.query<{ id: string }>(
    `INSERT INTO admin_access_requests (name, email, role, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.name.trim(), email, input.role, input.message?.trim() || null],
  );
  return { id: result.rows[0]!.id };
};

export const listAdminAccessRequests = async (): Promise<AdminAccessRequest[]> => {
  const result = await pool.query<{
    id: string; name: string; email: string; role: string;
    message: string | null; status: string; created_at: string; reviewed_at: string | null;
  }>(
    `SELECT id, name, email, role, message, status, created_at, reviewed_at
     FROM admin_access_requests
     ORDER BY
       CASE status WHEN 'pending' THEN 0 ELSE 1 END,
       created_at DESC
     LIMIT 200`,
  );
  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    message: r.message,
    status: r.status as 'pending' | 'approved' | 'rejected',
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
  }));
};

export const approveAdminAccessRequest = async (
  requestId: string,
  reviewer: { id: string; displayName: string; email: string },
  role: string,
): Promise<{ rawToken: string; expiresAt: Date; email: string }> => {
  const req = await pool.query<{ email: string; status: string }>(
    `SELECT email, status FROM admin_access_requests WHERE id = $1`,
    [requestId],
  );
  if ((req.rowCount ?? 0) === 0) {
    throw new NotFoundError('Access request not found', 'ACCESS_REQUEST_NOT_FOUND');
  }
  const row = req.rows[0]!;
  if (row.status !== 'pending') {
    throw new BadRequestError('Request has already been reviewed', 'ACCESS_REQUEST_ALREADY_REVIEWED');
  }

  const invite = await createAdminInviteToken({
    email: row.email,
    role,
    invitedBy: reviewer.id,
  });

  await pool.query(
    `UPDATE admin_access_requests
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2`,
    [reviewer.id, requestId],
  );

  return { rawToken: invite.rawToken, expiresAt: invite.expiresAt, email: row.email };
};

export const rejectAdminAccessRequest = async (
  requestId: string,
  reviewerId: string,
): Promise<void> => {
  const result = await pool.query(
    `UPDATE admin_access_requests
     SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2 AND status = 'pending'`,
    [reviewerId, requestId],
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new NotFoundError('Access request not found or already reviewed', 'ACCESS_REQUEST_NOT_FOUND');
  }
};
