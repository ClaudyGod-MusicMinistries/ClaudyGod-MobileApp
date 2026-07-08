import type { Request, Response } from 'express';
import { hasMinRole, ROLE_HIERARCHY } from '../modules/auth/auth.types.js';
import type { UserRole } from '../modules/auth/auth.types.js';
import { requireExactRole, requireRole } from './rbac.js';

const ROLES_LOW_TO_HIGH: UserRole[] = ['CLIENT', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

function fakeReq(role?: UserRole): Request {
  return (role ? { user: { sub: 'u1', role, email: 'u@example.com', displayName: 'U' } } : {}) as unknown as Request;
}

describe('hasMinRole', () => {
  it('ranks every role strictly higher than the one before it', () => {
    for (let i = 0; i < ROLES_LOW_TO_HIGH.length - 1; i += 1) {
      expect(ROLE_HIERARCHY[ROLES_LOW_TO_HIGH[i + 1]]).toBeGreaterThan(ROLE_HIERARCHY[ROLES_LOW_TO_HIGH[i]]);
    }
  });

  it('is satisfied by the exact role and every role above it', () => {
    for (let i = 0; i < ROLES_LOW_TO_HIGH.length; i += 1) {
      for (let j = i; j < ROLES_LOW_TO_HIGH.length; j += 1) {
        expect(hasMinRole(ROLES_LOW_TO_HIGH[j], ROLES_LOW_TO_HIGH[i])).toBe(true);
      }
    }
  });

  it('is not satisfied by any role below the minimum', () => {
    for (let i = 1; i < ROLES_LOW_TO_HIGH.length; i += 1) {
      for (let j = 0; j < i; j += 1) {
        expect(hasMinRole(ROLES_LOW_TO_HIGH[j], ROLES_LOW_TO_HIGH[i])).toBe(false);
      }
    }
  });

  // Regression test for the uploads.routes.ts bug: a strict `role !== 'ADMIN'` check
  // incorrectly locked out SUPER_ADMIN. hasMinRole must treat SUPER_ADMIN as satisfying
  // an ADMIN requirement.
  it('treats SUPER_ADMIN as satisfying an ADMIN minimum', () => {
    expect(hasMinRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
  });
});

// requireRole/requireExactRole throw synchronously rather than calling next(error) —
// Express's own middleware dispatcher catches synchronous throws and forwards them to
// error-handling middleware, so this is correct in production. Calling the middleware
// directly (outside Express) means the throw surfaces as a real exception here.
describe('requireRole middleware', () => {
  it('calls next() with no error when the caller meets the minimum role', () => {
    const next = jest.fn();
    requireRole('ADMIN')(fakeReq('SUPER_ADMIN'), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('throws a ForbiddenError when the caller is below the minimum role', () => {
    const next = jest.fn();
    expect(() => requireRole('ADMIN')(fakeReq('CLIENT'), {} as Response, next)).toThrow(/Requires ADMIN or higher/);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws an UnauthorizedError when there is no authenticated user', () => {
    const next = jest.fn();
    expect(() => requireRole('ADMIN')(fakeReq(undefined), {} as Response, next)).toThrow(/Authentication required/);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireExactRole middleware', () => {
  it('allows a role in the allow-list', () => {
    const next = jest.fn();
    requireExactRole('MODERATOR', 'ADMIN')(fakeReq('ADMIN'), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('throws a ForbiddenError for a role not in the allow-list, even a higher one', () => {
    const next = jest.fn();
    expect(() => requireExactRole('MODERATOR')(fakeReq('SUPER_ADMIN'), {} as Response, next)).toThrow(/Requires one of: MODERATOR/);
    expect(next).not.toHaveBeenCalled();
  });
});
