import type { JwtClaims } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtClaims;
    }
  }
}

export {};
