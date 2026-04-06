import type { MobileAppConfig } from './appConfig.schema';

export const DEFAULT_MOBILE_APP_CONFIG: MobileAppConfig = {
  version: 6,
  privacy: {
    contactEmail: 'privacy@claudygod.org',
    deleteConfirmPhrase: 'I CONFIRM',
    principles: [
      'We do not sell personal data.',
      'Security controls are available from inside the app.',
      'Privacy requests are processed by a human support team.',
      'Activity-based personalization can be reset by the user.',
    ],
  },
  help: {
    supportCenterUrl: 'https://claudygod.org',
    contact: [
      {
        id: 'website',
        icon: 'public',
        title: 'Ministry website',
        desc: 'Open the ClaudyGod website',
        actionUrl: 'https://claudygod.org',
      },
      {
        id: 'email',
        icon: 'email',
        title: 'Email support',
        desc: 'support@claudygod.org',
        actionUrl: 'mailto:support@claudygod.org',
      },
      {
        id: 'whatsapp',
        icon: 'forum',
        title: 'WhatsApp support',
        desc: 'Message the ministry support desk',
        actionUrl: 'https://wa.me/08188346382',
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
      { label: 'Platforms', value: 'Mobile + Web' },
      { label: 'Support desk', value: 'Human-led' },
      { label: 'Content flow', value: 'Daily' },
    ],
    featureChips: [
      { icon: 'library-music', label: 'Worship releases' },
      { icon: 'smart-display', label: 'Video replays' },
      { icon: 'menu-book', label: 'Daily word' },
      { icon: 'cast', label: 'TV + web ready' },
      { icon: 'lock', label: 'Secure access' },
      { icon: 'support-agent', label: 'Support desk' },
    ],
    team: [
      { name: 'Claudy God', role: 'Founder & Lead Artist', desc: 'Vision, music direction, and weekly drops.' },
      { name: 'Product Crew', role: 'Experience', desc: 'Design systems, research, and accessibility.' },
      { name: 'Engineering', role: 'Platform', desc: 'Streaming quality, playback reliability, and APIs.' },
    ],
    social: [
      { icon: 'public', label: 'Website', url: 'https://claudygod.org' },
      { icon: 'smart-display', label: 'YouTube', url: 'https://www.youtube.com/@ClaudyGODMinistries' },
      { icon: 'forum', label: 'WhatsApp', url: 'https://wa.me/18002528394' },
      { icon: 'alternate-email', label: 'Support', url: 'mailto:support@claudygod.org' },
    ],
    versionLabel: 'Version 1.0.0',
  },
  donate: {
    currency: 'USD',
    currencyOptions: [
      { code: 'USD', label: 'US Dollar', symbol: '$' },
      { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
    ],
    quickAmounts: ['$5', '$10', '$25', '$50', '$100'],
    quickAmountsByCurrency: {
      USD: ['$5', '$10', '$25', '$50', '$100'],
      NGN: ['₦1000', '₦2500', '₦5000', '₦10000', '₦20000'],
    },
    methods: [
      {
        id: 'card',
        icon: 'credit-card',
        label: 'Card / Apple Pay / Google Pay',
        subtitle: 'Fast checkout with secure payment providers',
        badge: 'Recommended',
      },
      {
        id: 'paystack',
        icon: 'bolt',
        label: 'Paystack',
        subtitle: 'Local card & bank payments (NGN)',
      },
      {
        id: 'flutterwave',
        icon: 'flare',
        label: 'Flutterwave',
        subtitle: 'Local transfers & cards (NGN)',
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
  layout: {
    homeSections: [],
    videoSections: [],
    playerSections: [],
    librarySections: [],
  },
  navigation: {
    tabs: [
      { id: 'home', label: 'Home', icon: 'home-filled' },
      { id: 'player', label: 'Music', icon: 'graphic-eq' },
      { id: 'videos', label: 'Videos', icon: 'smart-display' },
      { id: 'live', label: 'Live', icon: 'live-tv' },
      { id: 'library', label: 'Library', icon: 'library-music' },
    ],
  },
  discovery: {
    categories: [],
    shortcuts: [],
  },
  settingsHub: {
    sections: [],
  },
  monetization: {
    adsEnabled: true,
    disclosureLabel: 'Sponsored',
    placements: [
      {
        id: 'landing-hero',
        title: 'Landing promotion',
        subtitle: 'Featured campaign slot for the public landing experience.',
        screen: 'landing',
        enabled: true,
        maxItems: 1,
      },
      {
        id: 'home-spotlight',
        title: 'Home spotlight',
        subtitle: 'Sponsored placement inside the signed-in home feed.',
        screen: 'home',
        enabled: true,
        maxItems: 1,
      },
      {
        id: 'video-spotlight',
        title: 'Video spotlight',
        subtitle: 'Campaigns targeted at the video screen.',
        screen: 'videos',
        enabled: true,
        maxItems: 1,
      },
      {
        id: 'music-spotlight',
        title: 'Music spotlight',
        subtitle: 'Campaigns targeted at listening flows and the player screen.',
        screen: 'player',
        enabled: true,
        maxItems: 1,
      },
    ],
  },
  intelligence: {
    assistantEnabled: true,
    adCopySuggestionsEnabled: true,
    providerLabel: 'Integrated AI',
    defaultTone: 'Confident, concise, ministry-safe',
  },
};
