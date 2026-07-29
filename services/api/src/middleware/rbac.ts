import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { hasMinRole, ROLE_HIERARCHY } from '../modules/auth/auth.types';
import type { UserRole } from '../modules/auth/auth.types';

export function requireRole(minRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
    }
    if (!hasMinRole(req.user.role, minRole)) {
      throw new ForbiddenError(
        `Requires ${minRole} or higher. Your role: ${req.user.role}`,
        'INSUFFICIENT_ROLE',
      );
    }
    next();
  };
}

export function requireExactRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Requires one of: ${roles.join(', ')}. Your role: ${req.user.role}`,
        'INSUFFICIENT_ROLE',
      );
    }
    next();
  };
}

export function requireOwnerOrRole(minRole: UserRole, getOwnerId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
    }
    const ownerId = getOwnerId(req);
    const isOwner = ownerId === req.user.sub;
    const hasRole = hasMinRole(req.user.role, minRole);
    if (!isOwner && !hasRole) {
      throw new ForbiddenError('Access denied', 'INSUFFICIENT_ROLE');
    }
    next();
  };
}

export { hasMinRole, ROLE_HIERARCHY };
export type { UserRole };
