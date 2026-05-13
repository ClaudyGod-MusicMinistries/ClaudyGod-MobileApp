import { pool } from '../../db/pool';
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import { DEFAULT_MOBILE_APP_CONFIG } from './appConfig.defaults';
import { mobileAppConfigSchema, type MobileAppConfig } from './appConfig.schema';

const MOBILE_APP_CONFIG_KEY = 'mobile_app_experience';

interface AppConfigRow {
  config_value: unknown;
  updated_at: string | Date;
}

function normalizeNavigationTabs(
  tabs?: Partial<MobileAppConfig['navigation']['tabs']>,
): MobileAppConfig['navigation']['tabs'] {
  const defaults = DEFAULT_MOBILE_APP_CONFIG.navigation.tabs;
  const entries = Array.isArray(tabs) ? tabs : [];
  const byId = new Map(entries.map((tab) => [tab?.id, tab]));

  return defaults.map((defaultTab) => {
    const existing = byId.get(defaultTab.id);
    if (!existing) {
      return defaultTab;
    }

    return {
      id: defaultTab.id,
      label:
        typeof existing.label === 'string' && existing.label.trim().length > 0
          ? existing.label.trim()
          : defaultTab.label,
      icon:
        typeof existing.icon === 'string' && existing.icon.trim().length > 0
          ? existing.icon.trim()
          : defaultTab.icon,
    };
  });
}

function mergeWithDefaults(value: unknown): MobileAppConfig {
  const input = value && typeof value === 'object' ? (value as Partial<MobileAppConfig>) : {};

  return mobileAppConfigSchema.parse({
    ...DEFAULT_MOBILE_APP_CONFIG,
    ...input,
    privacy: {
      ...DEFAULT_MOBILE_APP_CONFIG.privacy,
      ...(input.privacy ?? {}),
    },
    help: {
      ...DEFAULT_MOBILE_APP_CONFIG.help,
      ...(input.help ?? {}),
    },
    about: {
      ...DEFAULT_MOBILE_APP_CONFIG.about,
      ...(input.about ?? {}),
    },
    donate: {
      ...DEFAULT_MOBILE_APP_CONFIG.donate,
      ...(input.donate ?? {}),
    },
    rate: {
      ...DEFAULT_MOBILE_APP_CONFIG.rate,
      ...(input.rate ?? {}),
    },
    layout: {
      ...DEFAULT_MOBILE_APP_CONFIG.layout,
      ...(input.layout ?? {}),
    },
    navigation: {
      ...DEFAULT_MOBILE_APP_CONFIG.navigation,
      ...(input.navigation ?? {}),
      tabs: normalizeNavigationTabs(input.navigation?.tabs),
    },
    discovery: {
      ...DEFAULT_MOBILE_APP_CONFIG.discovery,
      ...(input.discovery ?? {}),
    },
    settingsHub: {
      ...DEFAULT_MOBILE_APP_CONFIG.settingsHub,
      ...(input.settingsHub ?? {}),
    },
    monetization: {
      ...DEFAULT_MOBILE_APP_CONFIG.monetization,
      ...(input.monetization ?? {}),
    },
    intelligence: {
      ...DEFAULT_MOBILE_APP_CONFIG.intelligence,
      ...(input.intelligence ?? {}),
    },
  });
}

export const getMobileAppConfig = async (): Promise<{
  config: MobileAppConfig;
  meta: { key: string; updatedAt: string };
}> => {
  let result;
  try {
    result = await pool.query<AppConfigRow>(
      `SELECT config_value, updated_at
       FROM app_config_store
       WHERE config_key = $1
       LIMIT 1`,
      [MOBILE_APP_CONFIG_KEY],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return {
        config: DEFAULT_MOBILE_APP_CONFIG,
        meta: {
          key: MOBILE_APP_CONFIG_KEY,
          updatedAt: new Date().toISOString(),
        },
      };
    }
    throw error;
  }

  if (result.rowCount === 0) {
    const inserted = await pool.query<AppConfigRow>(
      `INSERT INTO app_config_store (config_key, config_value)
       VALUES ($1, $2::jsonb)
       RETURNING config_value, updated_at`,
      [MOBILE_APP_CONFIG_KEY, JSON.stringify(DEFAULT_MOBILE_APP_CONFIG)],
    );
    return {
      config: DEFAULT_MOBILE_APP_CONFIG,
      meta: {
        key: MOBILE_APP_CONFIG_KEY,
        updatedAt: new Date(inserted.rows[0]!.updated_at).toISOString(),
      },
    };
  }

  return {
    config: mergeWithDefaults(result.rows[0]!.config_value),
    meta: {
      key: MOBILE_APP_CONFIG_KEY,
      updatedAt: new Date(result.rows[0]!.updated_at).toISOString(),
    },
  };
};

export const updateMobileAppConfig = async (params: {
  config: MobileAppConfig;
  updatedByUserId: string;
}): Promise<{
  config: MobileAppConfig;
  meta: { key: string; updatedAt: string };
}> => {
  const config = mergeWithDefaults(params.config);

  const result = await pool.query<AppConfigRow>(
    `INSERT INTO app_config_store (config_key, config_value, updated_by)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (config_key)
     DO UPDATE SET
       config_value = EXCLUDED.config_value,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING config_value, updated_at`,
    [MOBILE_APP_CONFIG_KEY, JSON.stringify(config), params.updatedByUserId],
  );

  return {
    config,
    meta: {
      key: MOBILE_APP_CONFIG_KEY,
      updatedAt: new Date(result.rows[0]!.updated_at).toISOString(),
    },
  };
};

type MobileScreenKey = 'landing' | 'home' | 'videos' | 'player' | 'live' | 'library' | 'search' | 'settings';

const DEFAULT_SCREEN_SECTIONS: Record<MobileScreenKey, MobileAppConfig['layout']['homeSections']> = {
  landing: [
    {
      id: 'landing-featured',
      title: 'Featured',
      subtitle: 'Current highlights selected from published content.',
      contentTypes: ['audio', 'video', 'live'],
      actionLabel: 'Open',
      destinationTab: 'home',
      maxItems: 8,
    },
  ],
  home: [
    {
      id: 'home-featured',
      title: 'For You',
      subtitle: 'Fresh music, videos, live sessions, and recommendations.',
      contentTypes: ['audio', 'video', 'live', 'playlist'],
      actionLabel: 'Open',
      destinationTab: 'home',
      maxItems: 12,
    },
  ],
  videos: [
    {
      id: 'video-featured',
      title: 'Video Spotlight',
      subtitle: 'Published sessions, teaching, and replays.',
      contentTypes: ['video', 'live'],
      actionLabel: 'Watch',
      destinationTab: 'videos',
      maxItems: 12,
    },
  ],
  player: [
    {
      id: 'music-featured',
      title: 'Listening Queue',
      subtitle: 'Music, playlists, and audio-first releases.',
      contentTypes: ['audio', 'playlist'],
      actionLabel: 'Listen',
      destinationTab: 'player',
      maxItems: 12,
    },
  ],
  live: [
    {
      id: 'live-featured',
      title: 'Live & Replays',
      subtitle: 'Live sessions, upcoming streams, and recent replays.',
      contentTypes: ['live', 'video'],
      actionLabel: 'Watch',
      destinationTab: 'live',
      maxItems: 10,
    },
  ],
  library: [
    {
      id: 'library-recommended',
      title: 'Recommended for Your Library',
      subtitle: 'Suggestions shaped by your listening and saved content.',
      contentTypes: ['audio', 'video', 'playlist', 'live'],
      actionLabel: 'Save',
      destinationTab: 'library',
      maxItems: 12,
    },
  ],
  search: [
    {
      id: 'search-discovery',
      title: 'Discover',
      subtitle: 'Search-ready categories and shortcuts controlled by admin.',
      contentTypes: ['audio', 'video', 'playlist', 'live', 'announcement'],
      actionLabel: 'Search',
      destinationTab: 'search',
      maxItems: 12,
    },
  ],
  settings: [],
};

const sectionsForScreen = (
  config: MobileAppConfig,
  screen: MobileScreenKey,
): MobileAppConfig['layout']['homeSections'] => {
  const layoutMap: Partial<Record<MobileScreenKey, MobileAppConfig['layout']['homeSections']>> = {
    home: config.layout.homeSections,
    landing: config.layout.homeSections,
    videos: config.layout.videoSections,
    player: config.layout.playerSections,
    live: config.layout.videoSections,
    library: config.layout.librarySections,
    search: config.layout.homeSections,
  };

  const configured = layoutMap[screen] ?? [];
  return configured.length > 0 ? configured : DEFAULT_SCREEN_SECTIONS[screen];
};

export const getMobileScreenLayout = async (
  screen: MobileScreenKey,
): Promise<{
  screen: MobileScreenKey;
  version: number;
  updatedAt: string;
  navigation: MobileAppConfig['navigation'];
  sections: MobileAppConfig['layout']['homeSections'];
  discovery: MobileAppConfig['discovery'];
  settingsHub: MobileAppConfig['settingsHub'];
  monetization: MobileAppConfig['monetization'];
  intelligence: MobileAppConfig['intelligence'];
}> => {
  const { config, meta } = await getMobileAppConfig();

  return {
    screen,
    version: config.version,
    updatedAt: meta.updatedAt,
    navigation: config.navigation,
    sections: sectionsForScreen(config, screen),
    discovery: config.discovery,
    settingsHub: config.settingsHub,
    monetization: {
      ...config.monetization,
      placements: config.monetization.placements.filter(
        (placement) => placement.enabled && placement.screen === screen,
      ),
    },
    intelligence: config.intelligence,
  };
};

export const getMobileScreensManifest = async () => {
  const screens: MobileScreenKey[] = ['landing', 'home', 'videos', 'player', 'live', 'library', 'search', 'settings'];
  const { config, meta } = await getMobileAppConfig();

  return {
    version: config.version,
    updatedAt: meta.updatedAt,
    screens: screens.map((screen) => ({
      id: screen,
      sections: sectionsForScreen(config, screen).map((section) => ({
        id: section.id,
        title: section.title,
        destinationTab: section.destinationTab,
        maxItems: section.maxItems,
      })),
      adPlacements: config.monetization.placements
        .filter((placement) => placement.enabled && placement.screen === screen)
        .map((placement) => placement.id),
    })),
    navigation: config.navigation,
  };
};

export type { MobileScreenKey };
