import { apiFetch } from './apiClient';

export type ContentType = 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';

type ContentStatus = 'draft' | 'published';

interface ContentApiResponse {
  items: ApiContentItem[];
}

interface MobileYouTubeResponse {
  items: YouTubeVideoItem[];
}

export interface ApiContentItem {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  status?: ContentStatus;
  visibility?: ContentStatus;
  sourceKind?: 'upload' | 'external' | 'youtube';
  mediaUrl?: string;
  externalUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  tags?: string[];
  appSections?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  channelName?: string;
  duration?: string;
  liveViewerCount?: number;
  isLive?: boolean;
  author?: {
    id?: string;
    displayName?: string;
    email?: string;
  };
}

interface YouTubeVideoItem {
  youtubeVideoId: string;
  title: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  url: string;
  duration?: string;
  isLive?: boolean;
  liveViewerCount?: number;
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
}

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
  topCategories: string[];
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80';

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
  topCategories: ['All', 'Music', 'Videos', 'Live', 'Playlists'],
};

function safeSubtitle(item: ApiContentItem): string {
  if (item.channelName && item.channelName.trim().length > 0) {
    return item.channelName;
  }
  if (item.author?.displayName) {
    return item.author.displayName;
  }
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags.slice(0, 2).join(' • ');
  }
  return 'ClaudyGod Channel';
}

function safeDescription(item: ApiContentItem): string {
  if (item.description && item.description.trim().length > 0) {
    return item.description;
  }
  return item.type === 'live'
    ? 'Live session from your subscribed channel.'
    : 'Published content from your channel feed.';
}

function normalize(item: ApiContentItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: safeSubtitle(item),
    description: safeDescription(item),
    duration: item.duration || '--:--',
    imageUrl: item.thumbnailUrl || FALLBACK_IMAGE,
    mediaUrl: item.mediaUrl || item.externalUrl || item.url,
    type: item.type,
    isLive: item.isLive || item.type === 'live',
    liveViewerCount: item.liveViewerCount,
    createdAt: item.createdAt || item.updatedAt,
    appSections: Array.isArray(item.appSections) ? item.appSections : [],
  };
}

function normalizeYouTubeVideo(item: YouTubeVideoItem): FeedCardItem {
  return {
    id: `yt:${item.youtubeVideoId}`,
    title: item.title,
    subtitle: item.channelTitle || 'ClaudyGod YouTube',
    description: item.description || 'Latest video from YouTube channel feed.',
    duration: item.duration || (item.isLive ? 'LIVE' : '--:--'),
    imageUrl: item.thumbnailUrl || FALLBACK_IMAGE,
    mediaUrl: item.url,
    type: item.isLive ? 'live' : 'video',
    isLive: Boolean(item.isLive),
    liveViewerCount: item.liveViewerCount,
    createdAt: item.publishedAt,
    appSections: [],
  };
}

function classifyYouTubeItem(item: FeedCardItem): 'music' | 'video' | 'announcement' | 'live' {
  if (item.isLive || item.type === 'live') {
    return 'live';
  }

  const text = `${item.title} ${item.description} ${item.subtitle}`.toLowerCase();
  const isMusicLike =
    /(worship|praise|song|music|choir|hymn|album|track|audio|anthem|ministration)/.test(text);
  if (isMusicLike) {
    return 'music';
  }

  const isAnnouncementLike =
    /(announcement|update|event|service time|conference|schedule|notice|program)/.test(text);
  if (isAnnouncementLike) {
    return 'announcement';
  }

  return 'video';
}

function buildQuery(type?: ContentType): string {
  const params = new URLSearchParams({ status: 'published' });
  if (type) {
    params.set('type', type);
  }
  return `/v1/mobile/content?${params.toString()}`;
}

async function fetchByType(type: ContentType): Promise<FeedCardItem[]> {
  try {
    const response = await apiFetch<ContentApiResponse>(buildQuery(type));
    return response.items.map(normalize);
  } catch {
    return [];
  }
}

async function fetchAllPublished(): Promise<FeedCardItem[]> {
  try {
    const response = await apiFetch<ContentApiResponse>(buildQuery());
    return response.items.map(normalize);
  } catch {
    return [];
  }
}

async function fetchYouTubeFeed(): Promise<{
  videos: FeedCardItem[];
  music: FeedCardItem[];
  live: FeedCardItem[];
  announcements: FeedCardItem[];
  recent: FeedCardItem[];
}> {
  try {
    const response = await apiFetch<MobileYouTubeResponse>('/v1/mobile/youtube/videos?maxResults=20');
    const normalized = response.items.map(normalizeYouTubeVideo);
    const music: FeedCardItem[] = [];
    const videos: FeedCardItem[] = [];
    const live: FeedCardItem[] = [];
    const announcements: FeedCardItem[] = [];

    for (const item of normalized) {
      const bucket = classifyYouTubeItem(item);
      if (bucket === 'live') {
        live.push(item);
      } else if (bucket === 'music') {
        music.push({ ...item, type: 'audio' });
      } else if (bucket === 'announcement') {
        announcements.push({ ...item, type: 'announcement' });
      } else {
        videos.push(item);
      }
    }

    return {
      videos,
      music,
      live,
      announcements,
      recent: normalized,
    };
  } catch (error) {
    console.warn(
      '[contentService] YouTube feed fetch failed:',
      error instanceof Error ? error.message : String(error),
    );
    return { videos: [], music: [], live: [], announcements: [], recent: [] };
  }
}

async function fetchMostPlayed(): Promise<FeedCardItem[]> {
  try {
    const response = await apiFetch<{ items: ApiContentItem[] }>('/v1/analytics/most-played?limit=12');
    return response.items.map(normalize);
  } catch {
    return [];
  }
}

function dedupe(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];

  for (const item of items) {
    const key = (item.mediaUrl && item.mediaUrl.trim()) ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
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

export async function fetchFeedBundle(): Promise<FeedBundle> {
  const [all, music, videos, playlists, live, announcements, mostPlayed, youtubeFeed] = await Promise.all([
    fetchAllPublished(),
    fetchByType('audio'),
    fetchByType('video'),
    fetchByType('playlist'),
    fetchByType('live'),
    fetchByType('announcement'),
    fetchMostPlayed(),
    fetchYouTubeFeed(),
  ]);

  const mergedMusic = dedupe(removeAdItems([...music, ...youtubeFeed.music]));
  const mergedVideos = dedupe(removeAdItems([...videos, ...youtubeFeed.videos]));
  const mergedLive = dedupe(removeAdItems([...live, ...youtubeFeed.live]));
  const mergedAnnouncements = dedupe(removeAdItems([...announcements, ...youtubeFeed.announcements]));
  const mergedAll = dedupe(removeAdItems([
    ...all,
    ...youtubeFeed.recent,
    ...youtubeFeed.videos,
    ...youtubeFeed.music,
    ...youtubeFeed.live,
    ...youtubeFeed.announcements,
  ]));

  const recent = [...mergedAll].sort((a, b) => {
    const aTs = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTs = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (aTs !== bTs) return bTs - aTs;
    return a.id < b.id ? 1 : -1;
  });

  const pool = dedupe([
    ...mergedLive,
    ...mergedVideos,
    ...mergedMusic,
    ...playlists,
    ...mergedAnnouncements,
    ...mergedAll,
  ]);

  return {
    ...DEFAULT_BUNDLE,
    featured: pool[0] ?? null,
    music: mergedMusic.slice(0, 14),
    videos: mergedVideos.slice(0, 14),
    playlists: dedupe(playlists).slice(0, 12),
    live: mergedLive.slice(0, 10),
    ads: [],
    announcements: mergedAnnouncements.slice(0, 8),
    mostPlayed: dedupe(mostPlayed).slice(0, 12),
    recent: dedupe(recent).slice(0, 12),
    topCategories: DEFAULT_BUNDLE.topCategories,
  };
}

export function emptyFeedBundle(): FeedBundle {
  return DEFAULT_BUNDLE;
}
