export type UserRole = 'CLIENT' | 'CREATOR' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type UserTier = 'free' | 'premium' | 'vip';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  CLIENT: 0,
  CREATOR: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  tier: UserTier;
  createdAt: string;
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  role?: UserRole;
  adminSignupCode?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
  mfaToken?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: SafeUser;
  requiresEmailVerification?: boolean;
  mfaRequired?: boolean;
  mfaToken?: string;
  message?: string;
}

export interface RegisterResponse {
  accessToken?: string;
  user?: SafeUser;
  requiresEmailVerification: boolean;
  pendingEmail?: string;
  message: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  email?: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  code?: string;
  token?: string;
  email?: string;
}

export interface ResendVerificationEmailInput {
  email: string;
}

export interface AuthActionResponse {
  message: string;
}
