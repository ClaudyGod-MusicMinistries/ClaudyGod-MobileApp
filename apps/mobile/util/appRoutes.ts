export const APP_ROUTES = {
  landing: '/',
  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    verifyEmail: '/verify-email',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
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

export type PlayerRoutePath =
  | typeof APP_ROUTES.tabs.player
  | typeof APP_ROUTES.tabs.videos;
