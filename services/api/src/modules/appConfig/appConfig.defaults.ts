import type { MobileAppConfig } from './appConfig.schema';

export const DEFAULT_MOBILE_APP_CONFIG: MobileAppConfig = {
  version: 1,
  privacy: {
    contactEmail: 'privacy@claudygodmusic.com',
    deleteConfirmPhrase: 'I CONFIRM',
    principles: [
      'We do not sell personal data.',
      'Security controls are available from inside the app.',
      'Privacy requests are processed by a human support team.',
      'Activity-based personalization can be reset by the user.',
    ],
  },
  help: {
    supportCenterUrl: 'https://claudygodmusic.com/support',
    contact: [
      {
        id: 'chat',
        icon: 'chat-bubble',
        title: 'Live chat',
        desc: 'Average response under 2 minutes',
        actionUrl: 'https://claudygodmusic.com/support/chat',
      },
      {
        id: 'email',
        icon: 'email',
        title: 'Email support',
        desc: 'support@claudygodmusic.com',
        actionUrl: 'mailto:support@claudygodmusic.com',
      },
      {
        id: 'phone',
        icon: 'phone',
        title: 'Call support',
        desc: '+1 (800) 252-8394',
        actionUrl: 'tel:+18002528394',
      },
    ],
    faqs: [
      {
        id: 'buffering-tv',
        q: 'Playback buffering on TV?',
        a: 'Use Ethernet or 5GHz Wi-Fi and keep playback quality on Adaptive mode.',
      },
      {
        id: 'downloads-missing',
        q: 'Downloads not showing?',
        a: 'Open Library → Downloads and refresh. Check if storage permission is allowed.',
      },
      {
        id: 'recommendations-wrong',
        q: 'Wrong recommendations?',
        a: 'Clear watch and listen history in Privacy settings to reset suggestions.',
      },
      {
        id: 'report-content',
        q: 'How do I report content?',
        a: 'Open track menu and tap Report, or send the media link to support email.',
      },
    ],
  },
  about: {
    heroStats: [
      { label: 'Monthly listeners', value: '3.2M' },
      { label: 'Countries', value: '48' },
      { label: 'Avg uptime', value: '99.96%' },
    ],
    featureChips: [
      { icon: 'library-music', label: 'Massive catalog' },
      { icon: 'cloud-download', label: 'Offline ready' },
      { icon: 'equalizer', label: 'Adaptive streaming' },
      { icon: 'cast', label: 'TV + Cast support' },
      { icon: 'lock', label: 'Privacy-first' },
      { icon: 'groups', label: 'Community playlists' },
    ],
    team: [
      { name: 'Claudy God', role: 'Founder & Lead Artist', desc: 'Vision, music direction, and weekly drops.' },
      { name: 'Product Crew', role: 'Experience', desc: 'Design systems, research, and accessibility.' },
      { name: 'Engineering', role: 'Platform', desc: 'Streaming quality, playback reliability, and APIs.' },
    ],
    social: [
      { icon: 'smart-display', label: 'YouTube', url: 'https://youtube.com/@ClaudyGODMinistries' },
      { icon: 'photo-camera', label: 'Instagram', url: 'https://instagram.com/claudygodmusic' },
      { icon: 'facebook', label: 'Facebook', url: 'https://facebook.com/claudygodmusic' },
      { icon: 'alternate-email', label: 'Newsletter', url: 'mailto:hello@claudygodmusic.com' },
    ],
    versionLabel: 'Version 1.0.0',
  },
  donate: {
    currency: 'USD',
    quickAmounts: ['$5', '$10', '$25', '$50', '$100'],
    methods: [
      {
        id: 'card',
        icon: 'credit-card',
        label: 'Card / Apple Pay / Google Pay',
        subtitle: 'Fast checkout with secure payment providers',
        badge: 'Recommended',
      },
      {
        id: 'bank',
        icon: 'account-balance',
        label: 'Bank transfer',
        subtitle: 'Manual transfer and reconciliation support',
      },
      {
        id: 'sponsor',
        icon: 'volunteer-activism',
        label: 'Sponsor a live session',
        subtitle: 'Fund one broadcast or a ministry campaign slot',
      },
    ],
    plans: [
      {
        id: 'supporter',
        name: 'Supporter',
        amount: '$10',
        period: 'monthly',
        note: 'Helps cover storage, bandwidth and publishing operations.',
        icon: 'favorite-border',
      },
      {
        id: 'partner',
        name: 'Partner',
        amount: '$25',
        period: 'monthly',
        note: 'Supports music drops, live streaming and content production.',
        featured: true,
        icon: 'auto-awesome',
      },
      {
        id: 'mission',
        name: 'Mission Gift',
        amount: '$100',
        period: 'once',
        note: 'One-time support for outreach campaigns and platform improvements.',
        icon: 'public',
      },
    ],
    impactBreakdown: [
      { label: 'Streaming & CDN', value: 42, icon: 'wifi-tethering' },
      { label: 'Production & Editing', value: 33, icon: 'movie-edit' },
      { label: 'Outreach & Events', value: 25, icon: 'groups' },
    ],
  },
  rate: {
    iosStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_ID',
    androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.claudygod.mobile',
    feedbackRoute: '/settingsPage/help',
  },
};
