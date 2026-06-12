export const MOBILE_CONTENT_TYPE_OPTIONS = ['audio', 'video', 'playlist', 'announcement', 'live'] as const;

export const MOBILE_TAB_DESTINATION_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'videos', label: 'Videos' },
  { value: 'player', label: 'Music' },
  { value: 'live', label: 'Live' },
  { value: 'library', label: 'Library' },
  { value: 'search', label: 'Search' },
] as const;

export const DISCOVERY_CATEGORY_OPTIONS = ['All', 'audio', 'video', 'playlist', 'live', 'announcement'] as const;

export const SETTINGS_DESTINATION_OPTIONS = [
  { value: 'tabs.home', label: 'Home tab' },
  { value: 'tabs.player', label: 'Music tab' },
  { value: 'tabs.videos', label: 'Videos tab' },
  { value: 'tabs.live', label: 'Live tab' },
  { value: 'tabs.library', label: 'Library tab' },
  { value: 'tabs.search', label: 'Search tab' },
  { value: 'tabs.settings', label: 'Settings tab' },
  { value: 'profile', label: 'Profile' },
  { value: 'settings.privacy', label: 'Privacy' },
  { value: 'settings.donate', label: 'Donate' },
  { value: 'settings.help', label: 'Help' },
  { value: 'settings.about', label: 'About' },
  { value: 'settings.rate', label: 'Rate app' },
] as const;

export const AD_PLACEMENT_SCREEN_OPTIONS = [
  { value: 'landing', label: 'Landing' },
  { value: 'home', label: 'Home' },
  { value: 'videos', label: 'Videos' },
  { value: 'player', label: 'Music player' },
  { value: 'live', label: 'Live' },
  { value: 'library', label: 'Library' },
  { value: 'search', label: 'Search' },
] as const;

export interface LayoutGroupMeta {
  key: string;
  title: string;
  description: string;
  defaultActionLabel: string;
  defaultDestinationTab: string;
}

export const MOBILE_LAYOUT_GROUPS: LayoutGroupMeta[] = [
  { key: 'homeSections', title: 'Home', description: 'Sections for ClaudyGod Music, Nuggets of Truth, Worship Hour, Teens, Kids, and Speaks.', defaultActionLabel: 'Open', defaultDestinationTab: 'home' },
  { key: 'videoSections', title: 'Videos', description: 'Video sections for Worship Hour, Teens, Kids, and Speaks.', defaultActionLabel: 'Watch', defaultDestinationTab: 'videos' },
  { key: 'playerSections', title: 'Music', description: 'Audio sections for ClaudyGod Music, Nuggets of Truth, and Worship Hour.', defaultActionLabel: 'Listen', defaultDestinationTab: 'player' },
  { key: 'librarySections', title: 'Library', description: 'Saved collections for ClaudyGod Music, Speaks, and Kids.', defaultActionLabel: 'Open', defaultDestinationTab: 'library' },
];

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function cloneMobileConfig<T>(value: T): T {
  if (!value) return {} as T;
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createLayoutSection(group: string): Record<string, unknown> {
  const meta = MOBILE_LAYOUT_GROUPS.find((e) => e.key === group);
  const baseName = meta ? meta.title.toLowerCase() : 'section';
  return {
    id: makeId(baseName),
    title: `${meta ? meta.title : 'New'} Section`,
    subtitle: 'Describe what belongs in this ClaudyGod section.',
    contentTypes: ['video'],
    actionLabel: meta?.defaultActionLabel ?? 'Open',
    destinationTab: meta?.defaultDestinationTab ?? 'home',
    maxItems: 8,
  };
}

export function createDiscoveryShortcut(): Record<string, unknown> {
  return { id: makeId('shortcut'), icon: 'travel-explore', label: 'New shortcut', query: 'worship', category: 'All' };
}

export function createSettingsHubSection(): Record<string, unknown> {
  return { id: makeId('group'), title: 'New Group', items: [createSettingsHubItem()] };
}

export function createSettingsHubItem(): Record<string, unknown> {
  return { id: makeId('item'), icon: 'tune', label: 'New item', hint: 'Describe where this link should take the user.', destination: 'tabs.settings' };
}

export function createAdPlacement(): Record<string, unknown> {
  return { id: makeId('placement'), title: 'Sponsored placement', subtitle: 'Promoted slot inside the mobile app experience.', screen: 'home', enabled: true, maxItems: 1 };
}
