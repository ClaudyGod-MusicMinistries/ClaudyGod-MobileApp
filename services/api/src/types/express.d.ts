import type { JwtClaims } from '../utils/jwt';
import type { MobileInstallation } from '../modules/mobile/installation.service';

declare global {
  namespace Express {
    interface Request {
      user?: JwtClaims;
      installation?: MobileInstallation;
    }
  }
}

export {};
