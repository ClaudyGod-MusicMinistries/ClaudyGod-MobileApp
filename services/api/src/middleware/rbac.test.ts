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

describe('requireRole middleware', () => {
  it('calls next() with no error when the caller meets the minimum role', () => {
    const next = jest.fn();
    requireRole('ADMIN')(fakeReq('SUPER_ADMIN'), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(error) when the caller is below the minimum role', () => {
    const next = jest.fn();
    requireRole('ADMIN')(fakeReq('CLIENT'), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls next(error) when there is no authenticated user', () => {
    const next = jest.fn();
    requireRole('ADMIN')(fakeReq(undefined), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('requireExactRole middleware', () => {
  it('allows a role in the allow-list', () => {
    const next = jest.fn();
    requireExactRole('MODERATOR', 'ADMIN')(fakeReq('ADMIN'), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a higher role not in the allow-list', () => {
    const next = jest.fn();
    requireExactRole('MODERATOR')(fakeReq('SUPER_ADMIN'), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
