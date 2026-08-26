import type { RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { hasMinRole } from './rbac';

export const requirePrivilegedMfa: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
  if (!hasMinRole(req.user.role, 'CREATOR')) {
    next();
    return;
  }
  if (req.user.mfaVerified) {
    next();
    return;
  }
  if (!req.user.mfaEnabled) {
    throw new ForbiddenError('Multi-factor authentication is required for privileged access', 'MFA_ENROLLMENT_REQUIRED');
  }
  throw new ForbiddenError('Multi-factor verification is required for this session', 'MFA_VERIFICATION_REQUIRED');
};
