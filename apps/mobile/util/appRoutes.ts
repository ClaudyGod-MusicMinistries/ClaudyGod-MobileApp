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

export const TAB_ROUTE_BY_ID: Record<MobileTabId, string> = {
  home: APP_ROUTES.tabs.home,
  videos: APP_ROUTES.tabs.videos,
  player: APP_ROUTES.tabs.player,
  library: APP_ROUTES.tabs.library,
  search: APP_ROUTES.tabs.search,
};

export type PlayerRoutePath =
  | typeof APP_ROUTES.live.detail
  | typeof APP_ROUTES.tabs.player
  | typeof APP_ROUTES.tabs.videos;
