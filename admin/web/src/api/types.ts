import type { ContentType, ContentRequestStatus, AdStatus, AdCampaignPlacement, LiveStatus, SupportRequestStatus, UserRoleValue } from '@/utils/constants';

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRoleValue;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginSuccessResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
  mfaRequired?: false;
}

export interface LoginMfaRequiredResponse {
  mfaRequired: true;
  mfaToken: string;
  message?: string;
}

export type LoginResponse = LoginSuccessResponse | LoginMfaRequiredResponse;

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Content ──────────────────────────────────────────────────────────────────

export type ContentSourceKind = 'upload' | 'youtube' | 'external';
export type ContentVisibility = 'draft' | 'published';

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  url?: string;
  thumbnailUrl?: string;
  sourceKind?: ContentSourceKind;
  externalSourceId?: string;
  channelName?: string;
  duration?: string;
  appSections: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  visibility: ContentVisibility;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; displayName: string; email: string; role: string };
}

// A lightweight preview shape — the dashboard's "Latest content" widget only
// ever sends this subset, not the full ContentItem.
export interface DashboardContentPreview {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  visibility: ContentVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ContentCreateInput {
  title: string;
  description: string;
  type: ContentType;
  url?: string;
  thumbnailUrl?: string;
  mediaUploadSessionId?: string;
  thumbnailUploadSessionId?: string;
  channelName?: string;
  duration?: string;
  sourceKind?: ContentSourceKind;
  externalSourceId?: string;
  appSections?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  visibility?: ContentVisibility;
  isFeatured?: boolean;
}

export interface ContentUpdateInput extends Partial<ContentCreateInput> {
  id: string;
}

export interface ContentRequest {
  id: string;
  title: string;
  type: ContentType;
  status: ContentRequestStatus;
  requestedBy: { id: string; email: string; displayName: string | null };
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Live ─────────────────────────────────────────────────────────────────────

export interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  status: LiveStatus;
  visibility: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  viewerCount: number;
  createdAt: string;
}

export interface LiveSessionInput {
  title: string;
  description?: string;
  visibility?: string;
  scheduledAt?: string;
}

// ─── Ads ──────────────────────────────────────────────────────────────────────

export interface AdCampaign {
  id: string;
  name: string;
  sponsorName: string;
  headline: string;
  body: string;
  status: AdStatus;
  placement: AdCampaignPlacement;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  audienceTags: string[];
  dailyBudgetCents: number;
  weight: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdCampaignInput {
  name: string;
  sponsorName: string;
  headline: string;
  body: string;
  placement: AdCampaignPlacement;
  status?: AdStatus;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  audienceTags?: string[];
  dailyBudgetCents?: number;
  weight?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface AiAdCopyResponse {
  headline: string;
  body: string;
}

// ─── App Config ───────────────────────────────────────────────────────────────
// Mirrors services/api's mobileAppConfigSchema field-for-field. The PUT endpoint
// requires the ENTIRE object every save (fully .strict() + required) — MobileConfigView.vue
// exposes editing for every section here.

export type MobileContentType = 'audio' | 'video' | 'playlist' | 'announcement' | 'live';
export type MobileTabId = 'home' | 'videos' | 'player' | 'live' | 'library' | 'search';

export interface MobileLayoutSection {
  id: string;
  title: string;
  subtitle: string;
  contentTypes: MobileContentType[];
  actionLabel: string;
  destinationTab: MobileTabId;
  maxItems: number;
}

export interface MobileNavigationTab {
  id: MobileTabId;
  label: string;
  icon: string;
}

export type DiscoveryCategory = 'All' | 'audio' | 'video' | 'playlist' | 'live' | 'announcement';

export interface SearchShortcut {
  id: string;
  icon: string;
  label: string;
  query: string;
  category: DiscoveryCategory;
}

export type SettingsDestination =
  | 'tabs.home' | 'tabs.player' | 'tabs.videos' | 'tabs.live' | 'tabs.library' | 'tabs.search' | 'tabs.settings'
  | 'profile' | 'settings.privacy' | 'settings.donate' | 'settings.help' | 'settings.about' | 'settings.rate'
  | 'settings.referral';

export interface SettingsHubItem {
  id: string;
  icon: string;
  label: string;
  hint: string;
  destination: SettingsDestination;
}

export interface SettingsHubSection {
  id: string;
  title: string;
  items: SettingsHubItem[];
}

export type AdPlacementScreen = 'landing' | 'home' | 'videos' | 'player' | 'live' | 'library' | 'search';

export interface AdPlacementSlot {
  id: string;
  title: string;
  subtitle: string;
  screen: AdPlacementScreen;
  enabled: boolean;
  maxItems: number;
}

export interface HelpContact {
  id: string;
  icon: string;
  title: string;
  desc: string;
  actionUrl: string;
}

export interface Faq {
  id: string;
  q: string;
  a: string;
}

export interface SocialLink {
  icon: string;
  label: string;
  url: string;
}

export interface DonateMethod {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  badge?: string;
}

export interface DonatePlan {
  id: string;
  name: string;
  amount: string;
  period: 'once' | 'monthly';
  note: string;
  featured?: boolean;
  icon: string;
}

export interface ReferralStep {
  icon: string;
  title: string;
  body: string;
}

export interface ReferralRewardTier {
  icon: string;
  threshold: number;
  reward: string;
}

export interface AppConfig {
  version: number;
  privacy: {
    contactEmail: string;
    deleteConfirmPhrase: string;
    principles: string[];
  };
  help: {
    supportCenterUrl: string;
    contact: HelpContact[];
    faqs: Faq[];
  };
  about: {
    heroStats: Array<{ label: string; value: string }>;
    featureChips: Array<{ icon: string; label: string }>;
    team: Array<{ name: string; role: string; desc: string }>;
    social: SocialLink[];
    versionLabel: string;
  };
  donate: {
    currency: string;
    currencyOptions?: Array<{ code: string; label: string; symbol?: string }>;
    quickAmounts: string[];
    quickAmountsByCurrency?: Record<string, string[]>;
    methods: DonateMethod[];
    plans: DonatePlan[];
    impactBreakdown: Array<{ label: string; value: number; icon: string }>;
    scriptures: string[];
  };
  rate: {
    iosStoreUrl: string;
    androidStoreUrl: string;
    feedbackRoute: string;
  };
  referral: {
    howItWorks: ReferralStep[];
    rewardTiers: ReferralRewardTier[];
  };
  hero: {
    fallbackTitle: string;
    fallbackSubtitle: string;
  };
  layout: {
    homeSections: MobileLayoutSection[];
    videoSections: MobileLayoutSection[];
    playerSections: MobileLayoutSection[];
    librarySections: MobileLayoutSection[];
  };
  navigation: {
    tabs: MobileNavigationTab[];
  };
  discovery: {
    categories: DiscoveryCategory[];
    shortcuts: SearchShortcut[];
  };
  settingsHub: {
    sections: SettingsHubSection[];
  };
  monetization: {
    adsEnabled: boolean;
    disclosureLabel: string;
    placements: AdPlacementSlot[];
  };
  intelligence: {
    assistantEnabled: boolean;
    adCopySuggestionsEnabled: boolean;
    providerLabel: string;
    defaultTone: string;
  };
}

// ─── Word of Day ──────────────────────────────────────────────────────────────

export interface WordOfDay {
  id: string;
  title: string;
  passage: string;
  verse: string;
  reflection: string;
  messageDate: string;
  status: 'draft' | 'published' | 'archived';
  notifyEmail: boolean;
  publishedAt?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WordOfDayInput {
  title?: string;
  passage: string;
  verse: string;
  reflection: string;
  messageDate?: string;
  status: 'draft' | 'published';
  notifySubscribers?: boolean;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  newUsersLast7Days: number;
  verifiedUsers: number;
  totalContent: number;
  publishedContent: number;
  liveSessions: number;
  pendingRequests: number;
}

export interface DashboardSignal {
  id: string;
  tone: 'warning' | 'info' | 'success';
  title: string;
  detail: string;
}

export interface DashboardData {
  generatedAt: string;
  summary: DashboardStats;
  overview: {
    latestContent: DashboardContentPreview[];
    requestStatusBoard: { status: string; count: number }[];
    requestQueuePreview: ContentRequest[];
  };
  smartInsights: DashboardSignal[];
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRoleValue;
  isVerified: boolean;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  user: { id: string; email: string; displayName: string | null };
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface EngagementOverview {
  totalPlays: number;
  uniqueListeners: number;
  avgCompletionPct: number;
  topContent: { id: string; title: string; plays: number } | null;
}

export interface ContentInsight {
  contentId: string;
  title: string;
  type: string;
  plays: number;
  uniqueListeners: number;
  avgCompletionPct: number;
}

export interface CommunityInsight {
  type: string;
  message: string;
  value: number | null;
  trend: 'up' | 'down' | 'stable';
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

export interface YouTubeVideoItem {
  youtubeVideoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
  duration: string;
  isLive: boolean;
  suggestedAppSections: string[];
  suggestedTags: string[];
  contentId: string | null;
  contentVisibility: 'draft' | 'published' | null;
}

export interface YouTubeVideosResponse {
  channelId: string;
  fetchedAt: string;
  items: YouTubeVideoItem[];
  nextPageToken: string | null;
}

export interface YouTubeSyncStatus {
  channelId: string | null;
  channelTitle: string | null;
  lastSyncedAt: string | null;
  videoCount: number;
  status: 'idle' | 'syncing' | 'error';
}

export interface YouTubeImportItem {
  id: string;
  videoId: string;
  title: string;
  status: 'pending' | 'imported' | 'skipped' | 'error';
  visibility: 'draft' | 'published';
  importedAt: string | null;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: Record<string, { status: 'ok' | 'error'; latencyMs?: number; detail?: string }>;
  queues?: Record<string, { waiting: number; active: number; failed: number }>;
}
