import client from './client';
import type { UserRecord, SupportRequest, PaginatedResponse } from './types';

export interface UserListParams {
  search?: string;
  role?: number;
  page?: number;
  pageSize?: number;
}

export async function listUsers(params?: UserListParams): Promise<PaginatedResponse<UserRecord>> {
  const { data } = await client.get<PaginatedResponse<UserRecord>>('/v1/admin/users', { params });
  return data;
}

export async function updateUserRole(userId: string, role: number): Promise<UserRecord> {
  const { data } = await client.patch<UserRecord>(`/v1/admin/users/${userId}/role`, { role });
  return data;
}

export interface SupportRequestListParams {
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listSupportRequests(params?: SupportRequestListParams): Promise<PaginatedResponse<SupportRequest>> {
  const { data } = await client.get<PaginatedResponse<SupportRequest>>('/v1/admin/support-requests', { params });
  return data;
}

export async function updateSupportRequestStatus(id: string, status: string): Promise<SupportRequest> {
  const { data } = await client.patch<SupportRequest>(`/v1/admin/support-requests/${id}/status`, { status });
  return data;
}
