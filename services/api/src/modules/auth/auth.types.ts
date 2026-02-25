export type UserRole = 'CLIENT' | 'ADMIN';

export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
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
}
