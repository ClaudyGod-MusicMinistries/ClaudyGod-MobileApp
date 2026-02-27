export type UserRole = 'CLIENT' | 'ADMIN';

export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  emailVerifiedAt: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
  adminSignupCode?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: SafeUser;
  requiresEmailVerification?: boolean;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationEmailInput {
  email: string;
}

export interface AuthActionResponse {
  message: string;
}
