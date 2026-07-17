import { apiFetchWithMobileSession } from './authService';

export interface EngagementMetrics {
  userId: string;
  date: string;
  totalMinutesListened: number;
  contentCreated: number;
  contentViews: number;
  following: number;
  engagementScore: number;
  retentionScore: number;
  conversionRiskLevel: 'low' | 'medium' | 'high';
  lastActiveTime: number;
  joinedDate: number;
}

export interface EngagementInsight {
  id: string;
  type: 'achievement' | 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  actionRoute?: string;
  priority: 'high' | 'medium' | 'low';
}

export async function fetchEngagementMetrics(): Promise<EngagementMetrics> {
  return apiFetchWithMobileSession<EngagementMetrics>('/v1/engagement/metrics');
}

export async function fetchEngagementInsights(): Promise<EngagementInsight[]> {
  return apiFetchWithMobileSession<EngagementInsight[]>('/v1/engagement/insights');
}
