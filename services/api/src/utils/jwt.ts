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

const decodedJwtClaimsSchema = z
  .object({
    sub: z.union([z.string(), z.number()]).transform((value) => String(value)).pipe(z.string().min(1)),
    email: z.string().email(),
    role: z.enum(['CLIENT', 'ADMIN']),
    displayName: z.string().trim().min(1).max(120),
  })
  .strict();

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
