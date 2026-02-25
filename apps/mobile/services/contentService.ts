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
  sourceKind?: 'upload' | 'external';
  mediaUrl?: string;
  externalUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  tags?: string[];
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
  topCategories: ['All', 'Music', 'Videos', 'Live', 'Playlists', 'Ads'],
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
  return item.type === 'ad' ? 'Sponsored' : 'ClaudyGod Channel';
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
  };
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

async function fetchYouTubeFeed(): Promise<{ videos: FeedCardItem[]; live: FeedCardItem[] }> {
  try {
    const response = await apiFetch<MobileYouTubeResponse>('/v1/mobile/youtube/videos?maxResults=20');
    const normalized = response.items.map(normalizeYouTubeVideo);
    return {
      videos: normalized.filter((item) => !item.isLive),
      live: normalized.filter((item) => item.isLive),
    };
  } catch {
    return { videos: [], live: [] };
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
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

export async function fetchFeedBundle(): Promise<FeedBundle> {
  const [all, music, videos, playlists, live, ads, announcements, mostPlayed, youtubeFeed] = await Promise.all([
    fetchAllPublished(),
    fetchByType('audio'),
    fetchByType('video'),
    fetchByType('playlist'),
    fetchByType('live'),
    fetchByType('ad'),
    fetchByType('announcement'),
    fetchMostPlayed(),
    fetchYouTubeFeed(),
  ]);

  const mergedVideos = dedupe([...youtubeFeed.videos, ...videos]);
  const mergedLive = dedupe([...youtubeFeed.live, ...live]);
  const mergedAll = dedupe([...youtubeFeed.videos, ...youtubeFeed.live, ...all]);

  const recent = [...mergedAll].sort((a, b) => {
    return a.id < b.id ? 1 : -1;
  });

  const pool = dedupe([
    ...mergedLive,
    ...mergedVideos,
    ...music,
    ...playlists,
    ...announcements,
    ...ads,
    ...mergedAll,
  ]);

  return {
    ...DEFAULT_BUNDLE,
    featured: pool[0] ?? null,
    music: dedupe(music).slice(0, 14),
    videos: mergedVideos.slice(0, 14),
    playlists: dedupe(playlists).slice(0, 12),
    live: mergedLive.slice(0, 10),
    ads: dedupe(ads).slice(0, 8),
    announcements: dedupe(announcements).slice(0, 8),
    mostPlayed: dedupe(mostPlayed).slice(0, 12),
    recent: dedupe(recent).slice(0, 12),
    topCategories: DEFAULT_BUNDLE.topCategories,
  };
}

export function emptyFeedBundle(): FeedBundle {
  return DEFAULT_BUNDLE;
}
