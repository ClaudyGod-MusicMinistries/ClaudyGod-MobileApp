import type { MobileAppExperienceConfig } from '../services/userFlowService';

const DEFAULT_DISCOVERY: MobileAppExperienceConfig['discovery'] = {
  categories: ['All', 'audio', 'video', 'playlist', 'live', 'announcement'],
  shortcuts: [
    {
      id: 'worship',
      icon: 'graphic-eq',
      label: 'Trending worship',
      query: 'worship',
      category: 'audio',
    },
    {
      id: 'live',
      icon: 'live-tv',
      label: 'Live now',
      query: 'live',
      category: 'live',
    },
    {
      id: 'message',
      icon: 'menu-book',
      label: 'Message audio',
      query: 'message',
      category: 'announcement',
    },
  ],
};

const DEFAULT_SETTINGS_HUB: MobileAppExperienceConfig['settingsHub'] = {
  sections: [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'profile',
          icon: 'person-outline',
          label: 'Profile',
          hint: 'Name, email, and account details',
          destination: 'profile',
        },
        {
          id: 'library',
          icon: 'library-music',
          label: 'Your Library',
          hint: 'Saved listening and playlists',
          destination: 'tabs.library',
        },
        {
          id: 'privacy',
          icon: 'shield',
          label: 'Privacy',
          hint: 'Permissions and account controls',
          destination: 'settings.privacy',
        },
      ],
    },
    {
      id: 'discover',
      title: 'Discover',
      items: [
        {
          id: 'videos',
          icon: 'ondemand-video',
          label: 'Video Hub',
          hint: 'Live streams, replays, and featured watchlists',
          destination: 'tabs.videos',
        },
        {
          id: 'live',
          icon: 'live-tv',
          label: 'Live & Replays',
          hint: 'Current broadcasts, upcoming sessions, and saved replays',
          destination: 'tabs.live',
        },
        {
          id: 'search',
          icon: 'search',
          label: 'Search & Discovery',
          hint: 'Explore songs, videos, playlists, and ministry topics',
          destination: 'tabs.search',
        },
        {
          id: 'donate',
          icon: 'volunteer-activism',
          label: 'Support the Ministry',
          hint: 'Give and support the mission',
          destination: 'settings.donate',
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: 'help-outline',
          label: 'Help',
          hint: 'FAQs and support options',
          destination: 'settings.help',
        },
        {
          id: 'about',
          icon: 'info-outline',
          label: 'About ClaudyGod',
          hint: 'Learn about the ministry and the platform',
          destination: 'settings.about',
        },
        {
          id: 'rate',
          icon: 'rate-review',
          label: 'Rate App',
          hint: 'Share feedback about the experience',
          destination: 'settings.rate',
        },
      ],
    },
  ],
};

const CATEGORY_ALIAS_MAP: Record<string, MobileAppExperienceConfig['discovery']['categories'][number]> = {
  all: 'All',
  audio: 'audio',
  music: 'audio',
  video: 'video',
  videos: 'video',
  playlist: 'playlist',
  playlists: 'playlist',
  live: 'live',
  announcement: 'announcement',
  announcements: 'announcement',
};

export function getDiscoveryCategories(
  config?: MobileAppExperienceConfig | null,
  fallback?: string[],
): MobileAppExperienceConfig['discovery']['categories'] {
  if (config?.discovery?.categories?.length) {
    return config.discovery.categories;
  }

  if (fallback?.length) {
    const normalized = fallback
      .map((item) => CATEGORY_ALIAS_MAP[item.trim().toLowerCase()])
      .filter((item, index, array): item is MobileAppExperienceConfig['discovery']['categories'][number] =>
        Boolean(item) && array.indexOf(item) === index,
      );
    if (normalized.length) {
      return normalized;
    }
  }

  return DEFAULT_DISCOVERY.categories;
}

export function getDiscoveryShortcuts(
  config?: MobileAppExperienceConfig | null,
): MobileAppExperienceConfig['discovery']['shortcuts'] {
  return config?.discovery?.shortcuts?.length ? config.discovery.shortcuts : DEFAULT_DISCOVERY.shortcuts;
}

export function getSettingsHubSections(
  config?: MobileAppExperienceConfig | null,
): MobileAppExperienceConfig['settingsHub']['sections'] {
  return config?.settingsHub?.sections?.length ? config.settingsHub.sections : DEFAULT_SETTINGS_HUB.sections;
}
