import client from './client';
import type { AppConfig, WordOfDay } from './types';

export async function getAppConfig(): Promise<AppConfig> {
  const { data } = await client.get<AppConfig>('/v1/admin/app-config');
  return data;
}

export async function updateAppConfig(config: AppConfig): Promise<AppConfig> {
  const { data } = await client.put<AppConfig>('/v1/admin/app-config', config);
  return data;
}

export async function getWordOfDay(): Promise<WordOfDay> {
  const { data } = await client.get<WordOfDay>('/v1/admin/word-of-day/current');
  return data;
}

export async function updateWordOfDay(input: WordOfDay): Promise<WordOfDay> {
  const { data } = await client.put<WordOfDay>('/v1/admin/word-of-day/current', input);
  return data;
}
