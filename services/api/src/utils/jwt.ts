import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import type { UserRole } from '../modules/auth/auth.types';

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface RefreshJwtClaims {
  sub: string;
  sessionId: string;
  sessionFamilyId: string;
  type: 'refresh';
}

const decodedJwtClaimsSchema = z
  .object({
    sub: z.union([z.string(), z.number()]).transform((value) => String(value)).pipe(z.string().min(1)),
    email: z.string().email(),
    role: z.enum(['CLIENT', 'ADMIN']),
    displayName: z.string().trim().min(1).max(120),
  })
  .passthrough();

const decodedRefreshJwtClaimsSchema = z
  .object({
    sub: z.union([z.string(), z.number()]).transform((value) => String(value)).pipe(z.string().min(1)),
    sessionId: z.string().uuid(),
    sessionFamilyId: z.string().uuid(),
    type: z.literal('refresh'),
  })
  .passthrough();

export const signAccessToken = (claims: JwtClaims): string =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string): JwtClaims => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET as Secret);

  if (typeof decoded === 'string') {
    throw new Error('Invalid access token');
  }
  const parsed = decodedJwtClaimsSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error('Invalid access token claims');
  }

  return parsed.data;
};

export const signRefreshToken = (claims: RefreshJwtClaims): string =>
  jwt.sign(claims, env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d` as SignOptions['expiresIn'],
  });

export const verifyRefreshToken = (token: string): RefreshJwtClaims => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as Secret);

  if (typeof decoded === 'string') {
    throw new Error('Invalid refresh token');
  }

  const parsed = decodedRefreshJwtClaimsSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error('Invalid refresh token claims');
  }

  return parsed.data;
};
