export const APP_ROUTES = {
  landing: '/',
  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    verifyEmail: '/verify-email',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  live: {
    detail: '/live/[sessionId]',
  },
  tabs: {
    home: '/(tabs)/home',
    player: '/(tabs)/player',
    videos: '/(tabs)/videos',
    search: '/(tabs)/search',
    settings: '/(tabs)/settings',
    library: '/(tabs)/library',
  },
  profile: '/profile',
  settingsPages: {
    privacy: '/settingsPage/Privacy',
    donate: '/settingsPage/Donate',
    help: '/settingsPage/help',
    about: '/settingsPage/About',
    rate: '/settingsPage/Rate',
  },
} as const;

export type MobileTabId = 'home' | 'videos' | 'player' | 'library' | 'search';
export type AppRouteId =
  | 'tabs.home'
  | 'tabs.player'
  | 'tabs.videos'
  | 'tabs.library'
  | 'tabs.search'
  | 'tabs.settings'
  | 'profile'
  | 'settings.privacy'
  | 'settings.donate'
  | 'settings.help'
  | 'settings.about'
  | 'settings.rate';

export const TAB_ROUTE_BY_ID: Record<MobileTabId, string> = {
  home: APP_ROUTES.tabs.home,
  videos: APP_ROUTES.tabs.videos,
  player: APP_ROUTES.tabs.player,
  library: APP_ROUTES.tabs.library,
  search: APP_ROUTES.tabs.search,
};

export const APP_ROUTE_BY_ID: Record<AppRouteId, string> = {
  'tabs.home': APP_ROUTES.tabs.home,
  'tabs.player': APP_ROUTES.tabs.player,
  'tabs.videos': APP_ROUTES.tabs.videos,
  'tabs.library': APP_ROUTES.tabs.library,
  'tabs.search': APP_ROUTES.tabs.search,
  'tabs.settings': APP_ROUTES.tabs.settings,
  profile: APP_ROUTES.profile,
  'settings.privacy': APP_ROUTES.settingsPages.privacy,
  'settings.donate': APP_ROUTES.settingsPages.donate,
  'settings.help': APP_ROUTES.settingsPages.help,
  'settings.about': APP_ROUTES.settingsPages.about,
  'settings.rate': APP_ROUTES.settingsPages.rate,
};

export type PlayerRoutePath =
  | typeof APP_ROUTES.live.detail
  | typeof APP_ROUTES.tabs.player
  | typeof APP_ROUTES.tabs.videos;
