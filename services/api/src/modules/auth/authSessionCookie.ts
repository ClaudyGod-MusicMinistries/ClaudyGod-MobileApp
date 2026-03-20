import type { Request, Response } from 'express';
import { env } from '../../config/env';
import type { AuthResponse } from './auth.types';

const DEFAULT_SESSION_COOKIE_NAME = 'claudygod_session';
const WEB_CLIENT_PLATFORM = 'web';

const serializeCookie = (
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
    path?: string;
    maxAge?: number;
  } = {},
): string => {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  parts.push(`Path=${options.path ?? '/'}`);

  if (options.httpOnly ?? true) {
    parts.push('HttpOnly');
  }

  if (options.secure ?? env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  parts.push(`SameSite=${options.sameSite ?? 'Lax'}`);

  return parts.join('; ');
};

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex <= 0) {
        return accumulator;
      }

      const key = item.slice(0, separatorIndex).trim();
      const rawValue = item.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(rawValue);
      return accumulator;
    }, {});
};

export const getAuthSessionCookieName = (): string =>
  env.AUTH_SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME;

export const isWebClientRequest = (request: Request): boolean =>
  request.header('x-claudy-client-platform')?.trim().toLowerCase() === WEB_CLIENT_PLATFORM;

export const getAuthTokenFromRequest = (request: Request): string | null => {
  const cookieName = getAuthSessionCookieName();
  const cookies = parseCookies(request.headers.cookie);
  return cookies[cookieName] ?? null;
};

export const applyAuthSessionCookie = (response: Response, accessToken: string): void => {
  response.append(
    'Set-Cookie',
    serializeCookie(getAuthSessionCookieName(), accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    }),
  );
};

export const clearAuthSessionCookie = (response: Response): void => {
  response.append(
    'Set-Cookie',
    serializeCookie(getAuthSessionCookieName(), '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 0,
    }),
  );
};

export const respondWithAuthSession = (
  request: Request,
  response: Response,
  payload: AuthResponse,
  statusCode = 200,
): void => {
  response.setHeader('Cache-Control', 'no-store');

  if (isWebClientRequest(request)) {
    applyAuthSessionCookie(response, payload.accessToken);
    response.status(statusCode).json({
      user: payload.user,
      requiresEmailVerification: payload.requiresEmailVerification ?? false,
      message: payload.message,
    });
    return;
  }

  response.status(statusCode).json(payload);
};
