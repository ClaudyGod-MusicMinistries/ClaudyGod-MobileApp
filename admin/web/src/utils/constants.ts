export const REFRESH_TOKEN_KEY = 'claudy_admin_refresh_token';
export const MOBILE_PREVIEW_URL_KEY = 'claudy_admin_mobile_preview_url';
export const BRAND_LOGO_URL = '/brand/claudy-logo.png';
export const GOOGLE_LOGIN_URL = import.meta.env.VITE_GOOGLE_LOGIN_URL || '';
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
export const YOUTUBE_SYNC_DEFAULT_LIMIT = 8;

export enum Role {
  CLIENT = 0,
  CREATOR = 1,
  MODERATOR = 2,
  ADMIN = 3,
  SUPER_ADMIN = 4,
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.CLIENT]: 'Client',
  [Role.CREATOR]: 'Creator',
  [Role.MODERATOR]: 'Moderator',
  [Role.ADMIN]: 'Admin',
  [Role.SUPER_ADMIN]: 'Super Admin',
};

export const CONTENT_TYPES = ['audio', 'video', 'playlist', 'announcement'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUS_OPTIONS = ['draft', 'published'] as const;
export type ContentStatus = (typeof CONTENT_STATUS_OPTIONS)[number];

export const CONTENT_REQUEST_STATUS_OPTIONS = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'fulfilled',
  'rejected',
] as const;
export type ContentRequestStatus = (typeof CONTENT_REQUEST_STATUS_OPTIONS)[number];

export const SUPPORT_REQUEST_STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type SupportRequestStatus = (typeof SUPPORT_REQUEST_STATUS_OPTIONS)[number];

export const AD_STATUS_OPTIONS = ['draft', 'active', 'paused', 'ended'] as const;
export type AdStatus = (typeof AD_STATUS_OPTIONS)[number];

export const LIVE_STATUS_OPTIONS = ['scheduled', 'live', 'ended'] as const;
export type LiveStatus = (typeof LIVE_STATUS_OPTIONS)[number];

function isPrivateOrLocalHostname(hostname: string): boolean {
  const v = hostname.trim().toLowerCase();
  if (!v) return true;
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal', '10.0.2.2'].includes(v)) return true;
  if (v.endsWith('.local')) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(v)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)) return true;
  const m = v.match(/^172\.(\d{1,3})\./);
  if (m) { const n = Number(m[1]); return n >= 16 && n <= 31; }
  return false;
}

function deriveSiblingOrigin(sub: string): string {
  try {
    const u = new URL(window.location.href);
    if (isPrivateOrLocalHostname(u.hostname)) return '';
    const parts = u.hostname.split('.');
    if (parts.length < 3) return '';
    return `${u.protocol}//${sub}.${parts.slice(1).join('.')}`;
  } catch { return ''; }
}

export function resolveApiUrl(): string {
  const explicit = (import.meta.env.VITE_API_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  return deriveSiblingOrigin('apimobile');
}

export function normalizePublicUrl(value: string): string {
  const next = value.trim();
  if (!next) return '';
  const candidate = /^https?:\/\//i.test(next) ? next : `https://${next}`;
  try {
    const p = new URL(candidate);
    if (isPrivateOrLocalHostname(p.hostname)) return '';
    return p.toString().replace(/\/+$/, '');
  } catch { return ''; }
}

export const DEFAULT_MOBILE_PREVIEW_URL =
  normalizePublicUrl(import.meta.env.VITE_MOBILE_PREVIEW_URL || '') ||
  deriveSiblingOrigin('app') ||
  '';
