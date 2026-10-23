import type { UserRole } from '../modules/auth/auth.types';

export const CAPABILITIES = [
  'security.self_manage',
  'content.read',
  'content.manage',
  'content.publish',
  'live.manage',
  'mobile_config.manage',
  'word_of_day.manage',
  'mobile_preview.read',
  'ads.manage',
  'users.read',
  'users.manage',
  'support.manage',
  'email.manage',
  'admin_invites.manage',
  'admin_access.manage',
  'analytics.read',
  'youtube.manage',
  'storage.manage',
  'operations.manage',
  'website.manage',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const CREATOR_CAPABILITIES: Capability[] = ['security.self_manage'];
const MODERATOR_CAPABILITIES: Capability[] = [
  ...CREATOR_CAPABILITIES,
  'live.manage',
  'word_of_day.manage',
  'mobile_preview.read',
  'analytics.read',
];
const ADMIN_CAPABILITIES: Capability[] = [
  ...MODERATOR_CAPABILITIES,
  'content.read',
  'content.manage',
  'content.publish',
  'mobile_config.manage',
  'ads.manage',
  'users.read',
  'users.manage',
  'support.manage',
  'email.manage',
  'admin_invites.manage',
  'youtube.manage',
  'storage.manage',
  'website.manage',
];

export const ROLE_CAPABILITIES: Readonly<Record<UserRole, readonly Capability[]>> = Object.freeze({
  CLIENT: Object.freeze([]),
  CREATOR: Object.freeze(CREATOR_CAPABILITIES),
  MODERATOR: Object.freeze(MODERATOR_CAPABILITIES),
  ADMIN: Object.freeze(ADMIN_CAPABILITIES),
  SUPER_ADMIN: Object.freeze([...CAPABILITIES]),
});

export const normalizeRole = (role: UserRole | string | null | undefined): UserRole | null => {
  if (!role || typeof role !== 'string') return null;
  const upper = role.trim().toUpperCase();
  if (upper in ROLE_CAPABILITIES) {
    return upper as UserRole;
  }
  return null;
};

export const hasCapability = (role: UserRole | string | null | undefined, capability: Capability): boolean => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return (ROLE_CAPABILITIES[normalized] ?? []).includes(capability);
};

export const capabilitiesForRole = (role: UserRole | string | null | undefined): readonly Capability[] => {
  const normalized = normalizeRole(role);
  if (!normalized) return [];
  return ROLE_CAPABILITIES[normalized] ?? [];
};
