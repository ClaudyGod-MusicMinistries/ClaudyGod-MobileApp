import client from './client';
import type { LiveSession, LiveSessionInput, PaginatedResponse } from './types';

export interface LiveListParams {
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listSessions(params?: LiveListParams): Promise<PaginatedResponse<LiveSession>> {
  const { data } = await client.get<PaginatedResponse<LiveSession>>('/v1/live/manage', { params });
  return data;
}

export async function getSession(id: string): Promise<LiveSession> {
  const { data } = await client.get<LiveSession>(`/v1/live/manage/${id}`);
  return data;
}

export async function createSession(input: LiveSessionInput): Promise<LiveSession> {
  const { data } = await client.post<LiveSession>('/v1/live/manage', input);
  return data;
}

export async function updateSession(id: string, input: Partial<LiveSessionInput> & { status?: string }): Promise<LiveSession> {
  const { data } = await client.patch<LiveSession>(`/v1/live/manage/${id}`, input);
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  await client.delete(`/v1/live/manage/${id}`);
}
