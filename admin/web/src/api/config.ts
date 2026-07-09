import client from './client';
import type { AppConfig, WordOfDay, WordOfDayInput } from './types';

export async function getAppConfig(): Promise<AppConfig> {
  const { data } = await client.get<AppConfig>('/v1/admin/app-config');
  return data;
}

export async function updateAppConfig(config: AppConfig): Promise<AppConfig> {
  const { data } = await client.put<AppConfig>('/v1/admin/app-config', config);
  return data;
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
