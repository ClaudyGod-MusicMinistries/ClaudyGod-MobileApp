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

export interface OperationalJob {
  id: string;
  kind: 'content' | 'email' | 'media';
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'quarantined';
  summary: string;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
}

export async function getOperationalJobs(status?: OperationalJob['status']): Promise<OperationalJob[]> {
  const { data } = await client.get<{ jobs: OperationalJob[] }>('/v1/admin/operations/jobs', { params: { status, limit: 50 } });
  return data.jobs;
}

export async function retryOperationalJob(job: Pick<OperationalJob, 'kind' | 'id'>): Promise<void> {
  await client.post(`/v1/admin/operations/jobs/${job.kind}/${job.id}/retry`, {});
}

export interface SecurityAuditEvent {
  id: string;
  event: string;
  actor: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function getSecurityAuditEvents(): Promise<SecurityAuditEvent[]> {
  const { data } = await client.get<{ events: SecurityAuditEvent[] }>('/v1/admin/operations/audit', { params: { limit: 50 } });
  return data.events;
}

export interface OperationalSession {
  id: string; source: 'refresh' | 'oauth'; userId: string; email: string; displayName: string;
  role: string; ipAddress: string | null; userAgent: string | null; createdAt: string;
  lastUsedAt: string | null; expiresAt: string;
}

export async function getOperationalSessions(): Promise<OperationalSession[]> {
  const { data } = await client.get<{ sessions: OperationalSession[] }>('/v1/admin/operations/sessions', { params: { limit: 50 } });
  return data.sessions;
}

export async function revokeOperationalSession(session: Pick<OperationalSession, 'source' | 'id'>): Promise<void> {
  await client.delete(`/v1/admin/operations/sessions/${session.source}/${encodeURIComponent(session.id)}`);
}
