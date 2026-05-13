import { apiFetchWithMobileSession } from './authService';

export interface EngagementMetrics {
  userId: string;
  date: string;
  totalMinutesListened: number;
  contentCreated: number;
  contentViews: number;
  followers: number;
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

export interface EngagementOverview {
  userId: string;
  thisWeek: {
    minutesListened: number;
    itemsPlayed: number;
    newFollowers: number;
  };
  thisMonth: {
    minutesListened: number;
    itemsPlayed: number;
    newFollowers: number;
  };
  trends: {
    listeningTrend: number;
    followerTrend: number;
    engagementTrend: number;
  };
}

export interface CommunityData {
  userId: string;
  followers: {
    total: number;
    newThisMonth: number;
    topCountries: string[];
  };
  following: {
    total: number;
    categories: {
      worship: number;
      teaching: number;
      music: number;
      live: number;
    };
  };
  engagementRanking: {
    position: number;
    percentile: number;
  };
}

export async function fetchEngagementMetrics(): Promise<EngagementMetrics> {
  return apiFetchWithMobileSession<EngagementMetrics>('/v1/engagement/metrics');
}

export async function fetchEngagementInsights(): Promise<EngagementInsight[]> {
  return apiFetchWithMobileSession<EngagementInsight[]>('/v1/engagement/insights');
}

export async function fetchEngagementOverview(): Promise<EngagementOverview> {
  return apiFetchWithMobileSession<EngagementOverview>('/v1/engagement/overview');
}

export async function fetchCommunityData(): Promise<CommunityData> {
  return apiFetchWithMobileSession<CommunityData>('/v1/engagement/community');
}
