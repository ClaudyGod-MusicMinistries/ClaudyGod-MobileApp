import client from './client';
import type {
  ContentItem,
  ContentCreateInput,
  ContentUpdateInput,
  ContentRequest,
  PaginatedResponse,
} from './types';

export interface ContentListParams {
  type?: string;
  status?: string;
  section?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listContent(params?: ContentListParams): Promise<PaginatedResponse<ContentItem>> {
  const { data } = await client.get<PaginatedResponse<ContentItem>>('/v1/content/manage', { params });
  return data;
}

export async function getContent(id: string): Promise<ContentItem> {
  const { data } = await client.get<ContentItem>(`/v1/content/manage/${id}`);
  return data;
}

export async function createContent(input: ContentCreateInput): Promise<ContentItem> {
  const { data } = await client.post<ContentItem>('/v1/content/manage', input);
  return data;
}

export async function updateContent(input: ContentUpdateInput): Promise<ContentItem> {
  const { id, ...body } = input;
  const { data } = await client.patch<ContentItem>(`/v1/content/manage/${id}`, body);
  return data;
}

export async function deleteContent(id: string): Promise<void> {
  await client.delete(`/v1/content/manage/${id}`);
}

export async function bulkUpdateContent(ids: string[], patch: Partial<ContentUpdateInput>): Promise<void> {
  await client.patch('/v1/content/manage/bulk', { ids, ...patch });
}

// ─── Content requests ─────────────────────────────────────────────────────────

export interface RequestListParams {
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listRequests(params?: RequestListParams): Promise<PaginatedResponse<ContentRequest>> {
  const { data } = await client.get<PaginatedResponse<ContentRequest>>('/v1/content/requests', { params });
  return data;
}

export async function updateRequestStatus(
  id: string,
  status: string,
  adminNotes?: string,
): Promise<ContentRequest> {
  const { data } = await client.patch<ContentRequest>(`/v1/content/requests/${id}`, { status, adminNotes });
  return data;
}
