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

export interface AppConfig {
  layout: {
    sections: LayoutSection[];
  };
  discovery: {
    categories: string[];
    shortcuts: DiscoveryShortcut[];
  };
  settingsHub: {
    sections: SettingsHubSection[];
  };
  adPlacements: AdPlacement[];
}

export interface LayoutSection {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  query?: Record<string, unknown>;
}

export interface DiscoveryShortcut {
  id: string;
  label: string;
  query: string;
  category?: string;
  icon?: string;
}

export interface SettingsHubSection {
  id: string;
  label: string;
  items: SettingsHubItem[];
}

export interface SettingsHubItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  action?: string;
}

export interface AdPlacement {
  id: string;
  position: string;
  type: string;
  enabled: boolean;
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

export interface DashboardData {
  generatedAt: string;
  summary: DashboardStats;
  overview: {
    latestContent: DashboardContentPreview[];
    requestStatusBoard: { status: string; count: number }[];
    requestQueuePreview: ContentRequest[];
  };
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
}

export interface YouTubeVideosResponse {
  channelId: string;
  fetchedAt: string;
  items: YouTubeVideoItem[];
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
  importedAt: string | null;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: Record<string, { status: 'ok' | 'error'; latencyMs?: number; detail?: string }>;
  queues?: Record<string, { waiting: number; active: number; failed: number }>;
}
