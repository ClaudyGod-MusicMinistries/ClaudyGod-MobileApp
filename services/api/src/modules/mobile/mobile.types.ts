import type { ContentSourceKind, ContentType } from '../content/content.types';

export interface MobileFeedItem {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  type: ContentType | 'live' | 'ad';
  imageUrl: string;
  mediaUrl?: string;
  duration?: string;
  channelName?: string;
  sourceKind?: ContentSourceKind | 'youtube';
  appSections: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isLive?: boolean;
  liveViewerCount?: number;
  notificationChannelId?: string;
}

export interface MobileFeedRail {
  id: string;
  title: string;
  algorithm: string;
  items: MobileFeedItem[];
}

export interface MobileFeedResponse {
  generatedAt: string;
  featured: MobileFeedItem | null;
  rails: MobileFeedRail[];
  topCategories: string[];
}
