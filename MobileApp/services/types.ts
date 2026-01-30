// services/types.ts

export type MediaType = 'audio' | 'video' | 'playlist' | 'live';

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  artist?: string;
  imageUrl?: string;
  mediaUrl?: string;
  type: MediaType;
  duration?: string;
  createdAt?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  itemCount?: number;
}

export interface ApiResponse<T> {
  items: T[];
}

