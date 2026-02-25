import { apiFetch } from './apiClient';

export type ContentType = 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';

interface ContentApiResponse {
  items: ApiContentItem[];
}

export interface ApiContentItem {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  status?: 'draft' | 'published';
  sourceKind?: 'upload' | 'external';
  mediaUrl?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  channelName?: string;
  duration?: string;
  liveViewerCount?: number;
  isLive?: boolean;
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
    mediaUrl: item.mediaUrl || item.externalUrl,
    type: item.type,
    isLive: item.isLive || item.type === 'live',
    liveViewerCount: item.liveViewerCount,
  };
}

function buildQuery(type?: ContentType): string {
  const params = new URLSearchParams({ status: 'published' });
  if (type) {
    params.set('type', type);
  }
  return `/v1/content?${params.toString()}`;
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
  const [all, music, videos, playlists, live, ads, announcements, mostPlayed] = await Promise.all([
    fetchAllPublished(),
    fetchByType('audio'),
    fetchByType('video'),
    fetchByType('playlist'),
    fetchByType('live'),
    fetchByType('ad'),
    fetchByType('announcement'),
    fetchMostPlayed(),
  ]);

  const recent = [...all].sort((a, b) => {
    return a.id < b.id ? 1 : -1;
  });

  const pool = dedupe([
    ...live,
    ...videos,
    ...music,
    ...playlists,
    ...announcements,
    ...ads,
    ...all,
  ]);

  return {
    ...DEFAULT_BUNDLE,
    featured: pool[0] ?? null,
    music: dedupe(music).slice(0, 14),
    videos: dedupe(videos).slice(0, 14),
    playlists: dedupe(playlists).slice(0, 12),
    live: dedupe(live).slice(0, 10),
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
