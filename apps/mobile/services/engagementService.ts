import { apiFetch } from './apiClient';

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

/**
 * Fetch user engagement metrics from the server
 */
export async function fetchEngagementMetrics(userId?: string): Promise<EngagementMetrics> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiFetch<EngagementMetrics>(`/v1/engagement/metrics${query}`);
}

/**
 * Fetch personalized insights from the server
 */
export async function fetchEngagementInsights(userId?: string): Promise<EngagementInsight[]> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiFetch<EngagementInsight[]>(`/v1/engagement/insights${query}`);
}

/**
 * Fetch engagement overview data
 */
export async function fetchEngagementOverview(userId?: string): Promise<EngagementOverview> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiFetch<EngagementOverview>(`/v1/engagement/overview${query}`);
}

/**
 * Fetch community data
 */
export async function fetchCommunityData(userId?: string): Promise<CommunityData> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiFetch<CommunityData>(`/v1/engagement/community${query}`);
}
