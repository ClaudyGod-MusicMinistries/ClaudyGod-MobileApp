import client from './client';
import type { HealthCheck } from './types';

export async function getHealth(): Promise<HealthCheck> {
  const { data } = await client.get<HealthCheck>('/health');
  return data;
}

export interface StorageHealth {
  configured: boolean;
  reachable: boolean;
  bucket: string | null;
  endpointHost: string | null;
  sessions: { issued: number; uploaded: number; expired: number; failed: number };
  lastConfirmedAt: string | null;
  detail: string;
}

export async function getStorageHealth(): Promise<StorageHealth> {
  const { data } = await client.get<StorageHealth>('/v1/admin/storage/health');
  return data;
}
