import { apiFetch } from './apiClient';
import { apiFetchWithMobileSession, getStoredMobileSession } from './authService';
import { DEFAULT_CONTENT_IMAGE_URI } from '../util/brandAssets';
import { reportException } from '../lib/sentry';

export type ContentType = 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';

interface MobileFeedApiRail {
  id: string;
  title: string;
  algorithm: string;
  items: MobileFeedApiItem[];
}

interface MobileFeedApiLayoutSection {
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  destinationTab: string;
  maxItems: number;
  items: MobileFeedApiItem[];
  overflowCount: number;
}

interface MobileFeedApiLayoutSections {
  home: MobileFeedApiLayoutSection[];
  videos: MobileFeedApiLayoutSection[];
  player: MobileFeedApiLayoutSection[];
  library: MobileFeedApiLayoutSection[];
}

interface MobileFeedApiResponse {
  generatedAt: string;
  featured: MobileFeedApiItem | null;
  rails: MobileFeedApiRail[];
  layoutSections?: MobileFeedApiLayoutSections;
  topCategories: string[];
}

interface MobileFeedApiItem {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  type: ContentType;
  imageUrl?: string;
  mediaUrl?: string;
  duration?: string;
  channelName?: string;
  sourceKind?: 'upload' | 'external' | 'youtube';
  appSections?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isLive?: boolean;
  liveViewerCount?: number;
  notificationChannelId?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sponsorName?: string;
  placement?: string;
  campaignId?: string;
  youtubeVideoId?: string;
  playAsAudio?: boolean;
}

interface EngagementFeedResponse {
  items: MobileFeedApiItem[];
}

export interface FeedCardItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  imageUrl: string;
  mediaUrl?: string;
  type: ContentType;
  liveViewerCount?: number;
  isLive?: boolean;
  createdAt?: string;
  appSections?: string[];
  notificationChannelId?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sponsorName?: string;
  placement?: string;
  campaignId?: string;
  youtubeVideoId?: string;
  playAsAudio?: boolean;
}

export interface FeedLayoutSection {
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  destinationTab: string;
  maxItems: number;
  items: FeedCardItem[];
  overflowCount: number;
}

export type LayoutScreen = 'home' | 'videos' | 'player' | 'library';

export interface FeedBundle {
  featured: FeedCardItem | null;
  music: FeedCardItem[];
  videos: FeedCardItem[];
  playlists: FeedCardItem[];
  live: FeedCardItem[];
  ads: FeedCardItem[];
  announcements: FeedCardItem[];
  mostPlayed: FeedCardItem[];
  recent: FeedCardItem[];
  // Real per-user play history only (never a generic "latest releases"
  // substitute) — empty when the signed-in user hasn't played anything yet,
  // so "Continue listening" can honestly hide instead of showing filler.
  continueListening: FeedCardItem[];
  recommendations: FeedCardItem[];
  topCategories: string[];
  layoutSections: Record<LayoutScreen, FeedLayoutSection[]>;
}

const FALLBACK_IMAGE = DEFAULT_CONTENT_IMAGE_URI;

const EMPTY_LAYOUT_SECTIONS: Record<LayoutScreen, FeedLayoutSection[]> = {
  home: [],
  videos: [],
  player: [],
  library: [],
};

const DEFAULT_BUNDLE: FeedBundle = {
  featured: null,
  music: [],
  videos: [],
  playlists: [],
  live: [],
  ads: [],
  announcements: [],
  mostPlayed: [],
  recent: [],
  continueListening: [],
  recommendations: [],
  topCategories: ['All', 'Music', 'Videos', 'Live', 'Playlists'],
  layoutSections: EMPTY_LAYOUT_SECTIONS,
};

type QueryValue = string | number | boolean | null | undefined;

function buildQueryString(params: Record<string, QueryValue>): string {
  const pairs: string[] = [];

  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (value === undefined || value === null || value === '') {
      return;
    }

    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });

  return pairs.join('&');
}

function normalizeFeedItem(item: MobileFeedApiItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || item.channelName || 'ClaudyGod Channel',
    description: item.description || 'Content from your channel feed.',
    duration: item.duration || '--:--',
    imageUrl: item.imageUrl || FALLBACK_IMAGE,
    mediaUrl: item.mediaUrl,
    type: item.type,
    isLive: Boolean(item.isLive || item.type === 'live'),
    liveViewerCount: item.liveViewerCount,
    createdAt: item.createdAt || item.updatedAt,
    appSections: Array.isArray(item.appSections) ? item.appSections : [],
    notificationChannelId: item.notificationChannelId,
    ctaLabel: item.ctaLabel,
    ctaUrl: item.ctaUrl,
    sponsorName: item.sponsorName,
    placement: item.placement,
    campaignId: item.campaignId,
    youtubeVideoId: item.youtubeVideoId,
    playAsAudio: item.playAsAudio,
  };
}

interface SearchApiItem {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  durationLabel: string | null;
  tags: string[];
  createdAt: string;
}

interface SearchApiResponse {
  items: SearchApiItem[];
  hasMore: boolean;
}

function normalizeSearchItem(item: SearchApiItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.channelName || 'ClaudyGod Channel',
    description: item.description || 'Content from your channel feed.',
    duration: item.durationLabel || '--:--',
    imageUrl: item.thumbnailUrl || FALLBACK_IMAGE,
    mediaUrl: item.mediaUrl ?? undefined,
    type: item.contentType,
    isLive: item.contentType === 'live',
    createdAt: item.createdAt,
    appSections: [],
  };
}

export async function fetchSearchResults(query: string, type?: ContentType): Promise<FeedCardItem[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const params: Record<string, QueryValue> = { q: trimmed, limit: 30 };
  if (type) {
    params.type = type;
  }
  const qs = buildQueryString(params);
  const response = await apiFetch<SearchApiResponse>(`/v1/search?${qs}`);
  return response.items.map(normalizeSearchItem);
}

interface TrendingSearchesResponse {
  items: { query: string; count: number }[];
}

// Real usage, not a static list: aggregated from the same search log every
// search already writes to server-side (services/api search.service.ts
// getTrendingSearches). Used for the search screen's no-query state.
export async function fetchTrendingSearches(limit = 8): Promise<string[]> {
  try {
    const response = await apiFetch<TrendingSearchesResponse>(`/v1/search/trending?limit=${limit}`);
    return response.items.map((item) => item.query);
  } catch {
    return [];
  }
}

// Exported: also used by useLocalContent.ts to source the Library screen's
// "History" tab for signed-in users, which wants more items than the home
// feed's internal limit of 12.
export async function fetchMeRecentlyPlayed(limit = 12): Promise<FeedCardItem[]> {
  try {
    const response = await apiFetchWithMobileSession<EngagementFeedResponse>(
      `/v1/me/engagement/recently-played?limit=${limit}`,
    );
    return response.items.map(normalizeFeedItem);
  } catch (error) {
    // Silently returning [] here is indistinguishable from "this account
    // genuinely has no history" — which is exactly what made a broken
    // recording/fetch path look identical to a legitimate cold start.
    reportException(error, { tags: { flow: 'engagement-recently-played' } });
    return [];
  }
}

async function fetchMeMostPlayed(): Promise<FeedCardItem[]> {
  try {
    const response = await apiFetchWithMobileSession<EngagementFeedResponse>(
      '/v1/me/engagement/most-played?limit=12',
    );
    return response.items.map(normalizeFeedItem);
  } catch (error) {
    reportException(error, { tags: { flow: 'engagement-most-played' } });
    return [];
  }
}

async function fetchMeRecommendations(): Promise<FeedCardItem[]> {
  try {
    const response = await apiFetchWithMobileSession<EngagementFeedResponse>(
      '/v1/me/engagement/recommendations?limit=12',
    );
    return response.items.map(normalizeFeedItem);
  } catch (error) {
    reportException(error, { tags: { flow: 'engagement-recommendations' } });
    return [];
  }
}

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];

  for (const item of items) {
    const key =
      item.mediaUrl && item.mediaUrl.trim()
        ? `media:${item.mediaUrl.trim()}`
        : `id:${item.id}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function removeAdItems(items: FeedCardItem[]): FeedCardItem[] {
  return items.filter((item) => item.type !== 'ad');
}

function getRailItems(
  railMap: Map<string, FeedCardItem[]>,
  railId: string,
): FeedCardItem[] {
  return railMap.get(railId) || [];
}

function getSponsoredItems(rails: { id: string; items: FeedCardItem[] }[]): FeedCardItem[] {
  const sponsoredItems: FeedCardItem[] = [];

  for (const rail of rails) {
    if (!rail.id || rail.id.indexOf('sponsored-') !== 0) {
      continue;
    }

    for (const item of rail.items) {
      if (item.type === 'ad') {
        sponsoredItems.push(item);
      }
    }
  }

  return sponsoredItems;
}

function normalizeLayoutSections(
  layoutSections: MobileFeedApiLayoutSections | undefined,
): Record<LayoutScreen, FeedLayoutSection[]> {
  if (!layoutSections) {
    return EMPTY_LAYOUT_SECTIONS;
  }

  const normalizeScreen = (sections: MobileFeedApiLayoutSection[]): FeedLayoutSection[] =>
    sections.map((section) => ({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      actionLabel: section.actionLabel,
      destinationTab: section.destinationTab,
      maxItems: section.maxItems,
      items: section.items.map(normalizeFeedItem),
      overflowCount: section.overflowCount,
    }));

  return {
    home: normalizeScreen(layoutSections.home ?? []),
    videos: normalizeScreen(layoutSections.videos ?? []),
    player: normalizeScreen(layoutSections.player ?? []),
    library: normalizeScreen(layoutSections.library ?? []),
  };
}

function bundleFromApiFeed(response: MobileFeedApiResponse): FeedBundle {
  const apiRails: MobileFeedApiRail[] = Array.isArray(response.rails) ? response.rails : [];

  const normalizedRails: { id: string; items: FeedCardItem[] }[] = apiRails.map(
    (rail: MobileFeedApiRail) => ({
      id: rail.id,
      items: rail.items.map((item: MobileFeedApiItem) => normalizeFeedItem(item)),
    }),
  );

  const railMap = new Map<string, FeedCardItem[]>();

  for (const rail of normalizedRails) {
    railMap.set(rail.id, rail.items);
  }

  const featured = response.featured ? normalizeFeedItem(response.featured) : null;

  const music = dedupe(removeAdItems(getRailItems(railMap, 'worship-music')));
  const videos = dedupe(removeAdItems(getRailItems(railMap, 'video-spotlight')));
  const live = dedupe(removeAdItems(getRailItems(railMap, 'live-now')));
  const playlists = dedupe(removeAdItems(getRailItems(railMap, 'playlists')));
  const announcements = dedupe(removeAdItems(getRailItems(railMap, 'ministry-updates')));
  const mostPlayed = dedupe(removeAdItems(getRailItems(railMap, 'trending-now')));
  const recent = dedupe(removeAdItems(getRailItems(railMap, 'latest-releases')));
  const ads = dedupe(getSponsoredItems(normalizedRails));

  return {
    ...DEFAULT_BUNDLE,
    featured,
    music: music.slice(0, 14),
    videos: videos.slice(0, 14),
    playlists: playlists.slice(0, 12),
    live: live.slice(0, 10),
    ads: ads.slice(0, 8),
    announcements: announcements.slice(0, 8),
    mostPlayed: mostPlayed.slice(0, 12),
    recent: recent.slice(0, 12),
    recommendations: [],
    topCategories:
      Array.isArray(response.topCategories) && response.topCategories.length > 0
        ? response.topCategories
        : DEFAULT_BUNDLE.topCategories,
    layoutSections: normalizeLayoutSections(response.layoutSections),
  };
}

interface MobileSectionDetailApiResponse {
  section: {
    id: string;
    title: string;
    subtitle: string;
    actionLabel: string;
    destinationTab: string;
    maxItems: number;
  };
  items: MobileFeedApiItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface MobileSectionDetail {
  section: MobileSectionDetailApiResponse['section'];
  items: FeedCardItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export async function fetchMobileSectionDetail(
  sectionId: string,
  screen: LayoutScreen,
  page = 1,
  limit = 20,
): Promise<MobileSectionDetail> {
  const qs = buildQueryString({ screen, page, limit });
  const response = await apiFetch<MobileSectionDetailApiResponse>(`/v1/mobile/sections/${encodeURIComponent(sectionId)}?${qs}`);
  return {
    ...response,
    items: response.items.map(normalizeFeedItem),
  };
}

export async function fetchFeedBundle(): Promise<FeedBundle> {
  const feed = await apiFetch<MobileFeedApiResponse>('/v1/mobile/feed');
  const baseBundle = bundleFromApiFeed(feed);

  const storedSession = await getStoredMobileSession();
  const [recentlyPlayed, personalizedMostPlayed, recommendations] = storedSession.user
    ? await Promise.all([
        fetchMeRecentlyPlayed(),
        fetchMeMostPlayed(),
        fetchMeRecommendations(),
      ])
    : [[], [], []];

  return {
    ...baseBundle,
    continueListening: recentlyPlayed,
    mostPlayed: personalizedMostPlayed.length ? personalizedMostPlayed : baseBundle.mostPlayed,
    recommendations,
  };
}

export function emptyFeedBundle(): FeedBundle {
  return {
    featured: null,
    music: [],
    videos: [],
    playlists: [],
    live: [],
    ads: [],
    announcements: [],
    mostPlayed: [],
    recent: [],
    continueListening: [],
    recommendations: [],
    topCategories: [...DEFAULT_BUNDLE.topCategories],
    layoutSections: { home: [], videos: [], player: [], library: [] },
  };
}
