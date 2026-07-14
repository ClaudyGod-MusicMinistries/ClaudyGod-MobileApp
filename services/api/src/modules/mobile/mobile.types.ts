import type { ContentSourceKind, ContentType } from '../content/content.types';

export interface MobileFeedItem {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  type: ContentType | 'live' | 'ad';
  imageUrl: string | null;
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
  ctaLabel?: string;
  ctaUrl?: string;
  sponsorName?: string;
  placement?: string;
  campaignId?: string;
}

export interface MobileFeedRail {
  id: string;
  title: string;
  algorithm: string;
  items: MobileFeedItem[];
}

export type MobileLayoutScreen = 'home' | 'videos' | 'player' | 'library';

export interface MobileLayoutSectionResult {
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  destinationTab: string;
  maxItems: number;
  items: MobileFeedItem[];
  overflowCount: number;
  isCurated: boolean;
}

export interface MobileFeedResponse {
  generatedAt: string;
  featured: MobileFeedItem | null;
  rails: MobileFeedRail[];
  layoutSections: Record<MobileLayoutScreen, MobileLayoutSectionResult[]>;
  topCategories: string[];
}

export interface MobileSectionDetailResponse {
  section: {
    id: string;
    title: string;
    subtitle: string;
    actionLabel: string;
    destinationTab: string;
    maxItems: number;
  };
  items: MobileFeedItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  isCurated: boolean;
}
