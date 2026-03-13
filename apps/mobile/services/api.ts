// services/api.ts
import { ApiResponse, MediaItem } from './types';
import { apiFetch } from './apiClient';

export const api = {
  async getContent(): Promise<ApiResponse<MediaItem>> {
    return apiFetch<ApiResponse<MediaItem>>('/v1/content');
  },
  async createContent(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem> {
    return apiFetch<MediaItem>('/v1/content', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
};
