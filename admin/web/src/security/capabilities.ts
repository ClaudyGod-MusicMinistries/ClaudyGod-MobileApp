import type { UserRoleValue } from '@/utils/constants';

export const CAPABILITIES = [
  'security.self_manage', 'content.read', 'content.manage', 'content.publish', 'live.manage',
  'mobile_config.manage', 'word_of_day.manage', 'mobile_preview.read', 'ads.manage',
  'users.read', 'users.manage', 'admin_access.manage', 'analytics.read', 'youtube.manage',
  'storage.manage', 'operations.manage', 'website.manage',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const creator: Capability[] = ['security.self_manage'];
const moderator: Capability[] = [...creator, 'live.manage', 'word_of_day.manage', 'mobile_preview.read', 'analytics.read'];
const admin: Capability[] = [...moderator, 'content.read', 'content.manage', 'content.publish', 'mobile_config.manage',
  'ads.manage', 'users.read', 'users.manage', 'youtube.manage', 'storage.manage', 'website.manage'];

export const ROLE_CAPABILITIES: Readonly<Record<UserRoleValue, readonly Capability[]>> = Object.freeze({
  CLIENT: Object.freeze([]), CREATOR: Object.freeze(creator), MODERATOR: Object.freeze(moderator),
  ADMIN: Object.freeze(admin), SUPER_ADMIN: Object.freeze([...CAPABILITIES]),
});

export const hasCapability = (role: UserRoleValue | undefined, capability: Capability): boolean =>
  Boolean(role && ROLE_CAPABILITIES[role]?.includes(capability));
