import type { UserRole } from '../auth/auth.types';

export type ContentType = 'audio' | 'video' | 'playlist' | 'announcement';
export type ContentVisibility = 'draft' | 'published';
export type ContentFilterType = ContentType | 'live' | 'ad';
export type ContentSourceKind = 'upload' | 'youtube' | 'external';

export interface ContentAuthor {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  url?: string;
  thumbnailUrl?: string;
  channelName?: string;
  duration?: string;
  sourceKind?: ContentSourceKind;
  externalSourceId?: string;
  appSections?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  visibility: ContentVisibility;
  createdAt: string;
  updatedAt: string;
  author: ContentAuthor;
}

export interface CreateContentInput {
  title: string;
  description: string;
  type: ContentType;
  url?: string;
  thumbnailUrl?: string;
  channelName?: string;
  duration?: string;
  sourceKind?: ContentSourceKind;
  externalSourceId?: string;
  appSections?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  visibility: ContentVisibility;
}

export interface UpdateContentInput {
  title?: string;
  description?: string;
  type?: ContentType;
  url?: string;
  thumbnailUrl?: string;
  channelName?: string;
  duration?: string;
  sourceKind?: ContentSourceKind;
  externalSourceId?: string;
  appSections?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  visibility?: ContentVisibility;
}

export interface ContentListQuery {
  page: number;
  limit: number;
  type?: ContentFilterType;
  status?: ContentVisibility;
  visibility?: ContentVisibility;
  search?: string;
  updatedAfter?: string;
}

export interface ContentListResponse {
  page: number;
  limit: number;
  total: number;
  items: ContentItem[];
}
