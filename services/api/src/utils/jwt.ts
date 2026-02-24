import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../modules/auth/auth.types';

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export const signAccessToken = (claims: JwtClaims): string =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  });

export const verifyAccessToken = (token: string): JwtClaims => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof decoded === 'string') {
    throw new Error('Invalid access token');
  }

  const role: UserRole = decoded.role === 'ADMIN' ? 'ADMIN' : 'CLIENT';

  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
    role,
    displayName: String(decoded.displayName ?? ''),
  };
};
