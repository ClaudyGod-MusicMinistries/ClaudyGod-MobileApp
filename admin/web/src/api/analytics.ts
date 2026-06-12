import client from './client';
import type { DashboardData, EngagementOverview, ContentInsight, CommunityInsight } from './types';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>('/v1/admin/dashboard');
  return data;
}

export async function getEngagementOverview(): Promise<EngagementOverview> {
  const { data } = await client.get<EngagementOverview>('/v1/engagement/overview');
  return data;
}

export async function getContentInsights(params?: { limit?: number }): Promise<ContentInsight[]> {
  const { data } = await client.get<ContentInsight[]>('/v1/engagement/insights', { params });
  return data;
}

export async function getCommunityInsights(): Promise<CommunityInsight[]> {
  const { data } = await client.get<CommunityInsight[]>('/v1/engagement/community');
  return data;
}
