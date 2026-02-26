import { apiFetch } from './apiClient';

export interface WordOfDayItem {
  id: string;
  title: string;
  passage: string;
  verse: string;
  reflection: string;
  messageDate: string;
  status: 'draft' | 'published' | 'archived';
  notifyEmail: boolean;
  publishedAt?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchWordOfDay(): Promise<{ word: WordOfDayItem | null }> {
  return apiFetch('/v1/mobile/word-of-day');
}
