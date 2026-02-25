import type { UserRole } from '../auth/auth.types';

export type ContentType = 'audio' | 'video' | 'playlist' | 'announcement';
export type ContentVisibility = 'draft' | 'published';
export type ContentFilterType = ContentType | 'live' | 'ad';

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
  visibility: ContentVisibility;
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
