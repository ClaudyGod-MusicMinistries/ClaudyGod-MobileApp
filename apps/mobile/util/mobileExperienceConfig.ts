import type { MobileAppExperienceConfig } from '../services/userFlowService';

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

  return [];
}

export function getDiscoveryShortcuts(
  config?: MobileAppExperienceConfig | null,
): MobileAppExperienceConfig['discovery']['shortcuts'] {
  return config?.discovery?.shortcuts?.length ? config.discovery.shortcuts : [];
}

export function getSettingsHubSections(
  config?: MobileAppExperienceConfig | null,
): MobileAppExperienceConfig['settingsHub']['sections'] {
  return config?.settingsHub?.sections?.length ? config.settingsHub.sections : [];
}
