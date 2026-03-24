export const MOBILE_CONTENT_TYPE_OPTIONS = ['audio', 'video', 'playlist', 'announcement', 'live'];

export const MOBILE_TAB_DESTINATION_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'videos', label: 'Videos' },
  { value: 'player', label: 'Music' },
  { value: 'live', label: 'Live' },
  { value: 'library', label: 'Library' },
  { value: 'search', label: 'Search' },
];

export const DISCOVERY_CATEGORY_OPTIONS = ['All', 'audio', 'video', 'playlist', 'live', 'announcement'];

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
];

export const MOBILE_LAYOUT_GROUPS = [
  {
    key: 'homeSections',
    title: 'Home',
    description: 'Featured rails and editorial placement for the landing feed after sign-in.',
    defaultActionLabel: 'Open',
    defaultDestinationTab: 'home',
  },
  {
    key: 'videoSections',
    title: 'Videos',
    description: 'Video rails, replay placement, and live-focused collections.',
    defaultActionLabel: 'Watch',
    defaultDestinationTab: 'videos',
  },
  {
    key: 'playerSections',
    title: 'Music',
    description: 'Audio rails and music-player collections for listening flows.',
    defaultActionLabel: 'Listen',
    defaultDestinationTab: 'player',
  },
  {
    key: 'librarySections',
    title: 'Library',
    description: 'Saved collections, most-played rails, and personal archive groupings.',
    defaultActionLabel: 'Open',
    defaultDestinationTab: 'library',
  },
];

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function cloneMobileConfig(value) {
  if (!value) return {};
  return JSON.parse(JSON.stringify(value));
}

export function createLayoutSection(group) {
  const meta = MOBILE_LAYOUT_GROUPS.find((entry) => entry.key === group);
  const baseName = meta ? meta.title.toLowerCase() : 'section';

  return {
    id: makeId(baseName),
    title: `${meta ? meta.title : 'New'} Section`,
    subtitle: 'Describe what belongs in this area of the mobile app.',
    contentTypes: ['video'],
    actionLabel: meta?.defaultActionLabel || 'Open',
    destinationTab: meta?.defaultDestinationTab || 'home',
    maxItems: 8,
  };
}

export function createDiscoveryShortcut() {
  return {
    id: makeId('shortcut'),
    icon: 'travel-explore',
    label: 'New shortcut',
    query: 'worship',
    category: 'All',
  };
}

export function createSettingsHubSection() {
  return {
    id: makeId('group'),
    title: 'New Group',
    items: [createSettingsHubItem()],
  };
}

export function createSettingsHubItem() {
  return {
    id: makeId('item'),
    icon: 'tune',
    label: 'New item',
    hint: 'Describe where this link should take the user.',
    destination: 'tabs.settings',
  };
}
