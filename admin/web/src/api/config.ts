import client from './client';
import type { AppConfig, WordOfDay, WordOfDayInput } from './types';

export interface MobileSectionDiagnostic {
  total: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getAppConfig(): Promise<AppConfig> {
  const { data } = await client.get<{ config: AppConfig; meta: { key: string; updatedAt: string } }>('/v1/admin/app-config');
  return data.config;
}

export async function updateAppConfig(config: AppConfig): Promise<AppConfig> {
  const { data } = await client.put<{ config: AppConfig; meta: { key: string; updatedAt: string } }>('/v1/admin/app-config', { config });
  return data.config;
}

export async function getMobileSectionDiagnostic(
  sectionId: string,
  screen: 'home' | 'videos' | 'player' | 'library',
): Promise<MobileSectionDiagnostic> {
  const { data } = await client.get<{ total: number; limit: number; hasMore: boolean }>(
    `/v1/mobile/sections/${encodeURIComponent(sectionId)}`,
    { params: { screen, page: 1, limit: 1 } },
  );
  return { total: data.total, pageSize: data.limit, hasMore: data.hasMore };
}

export async function listWordsOfDay(): Promise<WordOfDay[]> {
  const { data } = await client.get<{ items: WordOfDay[] } | WordOfDay[]>('/v1/admin/word-of-day');
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function createWordOfDay(input: WordOfDayInput): Promise<WordOfDay> {
  const { data } = await client.post<WordOfDay>('/v1/admin/word-of-day', input);
  return data;
}

export async function updateWordOfDayById(id: string, input: WordOfDayInput): Promise<WordOfDay> {
  const { data } = await client.put<WordOfDay>(`/v1/admin/word-of-day/${id}`, input);
  return data;
}

export async function deleteWordOfDay(id: string): Promise<void> {
  await client.delete(`/v1/admin/word-of-day/${id}`);
}
