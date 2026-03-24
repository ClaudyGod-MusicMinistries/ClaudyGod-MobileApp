function isPrivateOrLocalHostname(hostname) {
  const value = String(hostname || '').trim().toLowerCase();
  if (!value) return true;

  if (
    value === 'localhost' ||
    value === '127.0.0.1' ||
    value === '::1' ||
    value === '0.0.0.0' ||
    value === 'host.docker.internal' ||
    value === '10.0.2.2'
  ) {
    return true;
  }

  if (value.endsWith('.local')) {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(value)) {
    return true;
  }

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
    return true;
  }

  const private172 = value.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (private172) {
    const secondOctet = Number(private172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

function deriveSiblingOrigin(targetSubdomain) {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const current = new URL(window.location.href);
    if (isPrivateOrLocalHostname(current.hostname)) {
      return '';
    }

    const parts = current.hostname.split('.');
    if (parts.length < 3) {
      return '';
    }

    return `${current.protocol}//${targetSubdomain}.${parts.slice(1).join('.')}`;
  } catch {
    return '';
  }
}

function resolveApiUrl() {
  const explicit = String(import.meta.env.VITE_API_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  return deriveSiblingOrigin('api');
}

export function normalizePublicUrl(value) {
  const next = String(value || '').trim();
  if (!next) return '';

  const candidate = /^https?:\/\//i.test(next) ? next : `https://${next}`;

  try {
    const parsed = new URL(candidate);
    if (isPrivateOrLocalHostname(parsed.hostname)) {
      return '';
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export const API_URL = resolveApiUrl();
export const GOOGLE_LOGIN_URL = import.meta.env.VITE_GOOGLE_LOGIN_URL || '';
export const ACCESS_TOKEN_KEY = 'claudy_admin_access_token';
export const MOBILE_PREVIEW_URL_KEY = 'claudy_admin_mobile_preview_url';
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
export const BRAND_LOGO_URL = '/brand/claudy-logo.webp';
export const CONTENT_TYPES = ['audio', 'video', 'playlist', 'announcement'];
export const VISIBILITY_OPTIONS = ['draft', 'published'];
export const USER_ROLE_OPTIONS = ['CLIENT', 'ADMIN'];
export const CONTENT_REQUEST_STATUS_OPTIONS = ['submitted', 'in_review', 'changes_requested', 'approved', 'fulfilled', 'rejected'];
export const YOUTUBE_SYNC_DEFAULT_LIMIT = 8;
export const ADMIN_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    caption: 'Health and access',
  },
  {
    id: 'editor',
    label: 'Content',
    caption: 'Uploads and library',
  },
  {
    id: 'mobile-config',
    label: 'Mobile',
    caption: 'App structure',
  },
  {
    id: 'ads-ai',
    label: 'Ads & AI',
    caption: 'Campaigns and automation',
  },
  {
    id: 'live',
    label: 'Live',
    caption: 'Broadcast and replay',
  },
  {
    id: 'mobile-preview',
    label: 'Preview',
    caption: 'Live app view',
  },
];
export const DEFAULT_MOBILE_PREVIEW_URL =
  normalizePublicUrl(import.meta.env.VITE_MOBILE_PREVIEW_URL) || deriveSiblingOrigin('app') || '';
export const WORKFLOW_STEPS = [
  {
    title: 'Submit',
    detail: 'Send one clean ticket with files, links, and placement details.',
  },
  {
    title: 'Review',
    detail: 'Track approvals, requested changes, and queue progress in one place.',
  },
  {
    title: 'Release',
    detail: 'Convert approved tickets into draft content, then publish when ready.',
  },
];
export const API_HOST_LABEL = (() => {
  if (!API_URL) {
    return 'configured API endpoint';
  }
  try {
    return new URL(API_URL).host;
  } catch {
    return String(API_URL || '').replace(/^https?:\/\//i, '');
  }
})();

export function readStoredToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function normalizePreviewUrl(value) {
  return normalizePublicUrl(value) || DEFAULT_MOBILE_PREVIEW_URL;
}

export function readStoredMobilePreviewUrl() {
  try {
    const stored = localStorage.getItem(MOBILE_PREVIEW_URL_KEY) || '';
    if (stored.trim()) {
      const normalized = normalizePreviewUrl(stored);
      if (normalized !== stored.trim().replace(/\/+$/, '')) {
        localStorage.setItem(MOBILE_PREVIEW_URL_KEY, normalized);
      }
      return normalized;
    }
  } catch {
    // Keep default URL when storage is unavailable.
  }
  return normalizePreviewUrl(DEFAULT_MOBILE_PREVIEW_URL);
}

export function storeToken(token) {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Storage can be blocked in strict privacy modes; keep runtime functional.
  }
}
