// services/api.ts
import { ApiResponse, MediaItem } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getContent(): Promise<ApiResponse<MediaItem>> {
    return request<ApiResponse<MediaItem>>('/v1/content');
  },
  async createContent(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem> {
    return request<MediaItem>('/v1/content', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
};

