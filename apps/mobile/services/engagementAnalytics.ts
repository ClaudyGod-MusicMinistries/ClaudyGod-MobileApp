/**
 * Business Model & Engagement Analytics Service
 * Tracks user engagement, retention metrics, and monetization opportunities
 */

export interface UserEngagementMetrics {
  userId: string;
  totalMinutesListened: number;
  contentCreated: number;
  contentViews: number;
  followers: number;
  following: number;
  engagementScore: number; // 0-100
  retentionScore: number; // 0-100
  conversionRiskLevel: 'high' | 'medium' | 'low'; // To identify at-risk users
  lastActiveTime: number;
  joinedDate: number;
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  userCount: number;
  avgEngagementScore: number;
  conversionRate: number;
  churnRate: number;
  recommendedActions: string[];
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice?: number;
  features: string[];
  targetSegment: 'free' | 'premium' | 'pro';
}

export interface EngagementInsight {
  type: 'warning' | 'opportunity' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  priority: 'high' | 'medium' | 'low';
}

class EngagementAnalyticsService {
  /**
   * Calculate engagement score for user (0-100)
   * Based on: listening time, content created, followers, activity frequency
   */
  calculateEngagementScore(metrics: {
    dailyActiveMinutes: number;
    contentCreatedThisMonth: number;
    followers: number;
    daysSinceLastActive: number;
  }): number {
    let score = 0;

    // Listening engagement: max 40 points
    const listeningScore = Math.min((metrics.dailyActiveMinutes / 60) * 40, 40);
    score += listeningScore;

    // Creator engagement: max 30 points
    const creatorScore = Math.min(metrics.contentCreatedThisMonth * 5, 30);
    score += creatorScore;

    // Community engagement: max 20 points
    const communityScore = Math.min((metrics.followers / 100) * 20, 20);
    score += communityScore;

    // Activity recency: max 10 points
    const recencyScore = metrics.daysSinceLastActive <= 7 ? 10 : metrics.daysSinceLastActive <= 30 ? 5 : 0;
    score += recencyScore;

    return Math.round(score);
  }

  /**
   * Calculate retention score (0-100)
   * Predicts likelihood user will stay active
   */
  calculateRetentionScore(metrics: {
    accountAgeDays: number;
    consecutiveActiveDays: number;
    avgDailyEngagement: number;
    contentCreationFrequency: number;
  }): number {
    let score = 0;

    // Account tenure: max 25 points
    const tenureScore = Math.min((metrics.accountAgeDays / 365) * 25, 25);
    score += tenureScore;

    // Activity streak: max 25 points
    const streakScore = Math.min((metrics.consecutiveActiveDays / 30) * 25, 25);
    score += streakScore;

    // Daily engagement: max 30 points
    const engagementScore = Math.min(metrics.avgDailyEngagement / 2, 30);
    score += engagementScore;

    // Creation frequency: max 20 points
    const creationScore = Math.min(metrics.contentCreationFrequency * 5, 20);
    score += creationScore;

    return Math.round(score);
  }

  /**
   * Identify user segment for targeted engagement
   */
  segmentUser(metrics: UserEngagementMetrics): UserSegment {
    const engagement = metrics.engagementScore;
    const retention = metrics.retentionScore;

    // High-value users: likely to convert to premium
    if (engagement >= 70 && retention >= 70) {
      return {
        id: 'high-value',
        name: 'Premium Prospects',
        description: 'Highly engaged users ready to convert',
        userCount: 0,
        avgEngagementScore: engagement,
        conversionRate: 45,
        churnRate: 5,
        recommendedActions: [
          'Show premium feature showcase',
          'Offer limited-time discount',
          'Enable offline listening trial',
          'Highlight exclusive content',
        ],
      };
    }

    // Growth users: engaged but not creating much
    if (engagement >= 50 && metrics.contentCreated < 5) {
      return {
        id: 'potential-creators',
        name: 'Potential Creators',
        description: 'Listeners who could become creators',
        userCount: 0,
        avgEngagementScore: engagement,
        conversionRate: 35,
        churnRate: 15,
        recommendedActions: [
          'Highlight creator tools',
          'Show creator success stories',
          'Offer creation tutorials',
          'Display monetization info',
        ],
      };
    }

    // At-risk users: declining engagement
    const daysSinceActive = (Date.now() - metrics.lastActiveTime) / (1000 * 60 * 60 * 24);
    if (engagement < 30 && daysSinceActive > 14) {
      return {
        id: 'at-risk',
        name: 'At-Risk Users',
        description: 'Users showing churn signals',
        userCount: 0,
        avgEngagementScore: engagement,
        conversionRate: 10,
        churnRate: 75,
        recommendedActions: [
          'Send personalized content recommendation',
          'Offer comeback bonus',
          'Show new features',
          'Send exclusive content',
        ],
      };
    }

    // Core users: regular, stable engagement
    return {
      id: 'core-users',
      name: 'Core Users',
      description: 'Regular, engaged community members',
      userCount: 0,
      avgEngagementScore: engagement,
      conversionRate: 25,
      churnRate: 10,
      recommendedActions: [
        'Encourage content creation',
        'Build community features',
        'Show peer recommendations',
        'Highlight achievements',
      ],
    };
  }

  /**
   * Generate actionable insights for user
   */
  generateInsights(metrics: UserEngagementMetrics): EngagementInsight[] {
    const insights: EngagementInsight[] = [];
    const daysSinceJoin = (Date.now() - metrics.joinedDate) / (1000 * 60 * 60 * 24);

    // Insight 1: Low engagement warning
    if (metrics.engagementScore < 30) {
      insights.push({
        type: 'warning',
        title: 'Low Engagement Detected',
        description: 'We notice you haven\'t been as active. Check out personalized recommendations!',
        actionRoute: '/tabs/home',
        priority: 'high',
      });
    }

    // Insight 2: Creator opportunity
    if (metrics.contentCreated === 0 && daysSinceJoin > 7) {
      insights.push({
        type: 'opportunity',
        title: 'Start Creating Today',
        description: 'Share your own music or content and reach thousands of listeners.',
        actionRoute: '/create',
        priority: 'medium',
      });
    }

    // Insight 3: Milestone achievement
    if (metrics.followers === 100) {
      insights.push({
        type: 'achievement',
        title: '🎉 100 Followers!',
        description: 'Congratulations! Your community is growing. You\'re building something special.',
        priority: 'medium',
      });
    }

    // Insight 4: Premium recommendation
    if (metrics.engagementScore > 60 && metrics.totalMinutesListened > 1000) {
      insights.push({
        type: 'recommendation',
        title: 'Upgrade to Premium',
        description: 'Unlock unlimited offline listening, high quality audio, and no ads.',
        actionRoute: '/premium',
        priority: 'medium',
      });
    }

    // Insight 5: Comeback offer
    const daysSinceActive = (Date.now() - metrics.lastActiveTime) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 7 && daysSinceActive < 30) {
      insights.push({
        type: 'recommendation',
        title: 'We Miss You!',
        description: 'Come back and enjoy 7 days of free premium as our welcome back gift.',
        actionRoute: '/home',
        priority: 'high',
      });
    }

    return insights;
  }

  /**
   * Premium features available for upsell
   */
  getPremiumFeatures(): PremiumFeature[] {
    return [
      {
        id: 'premium',
        name: 'Premium',
        description: 'Unlock the best listening experience',
        monthlyPrice: 9.99,
        annualPrice: 99.99,
        targetSegment: 'premium',
        features: [
          '✓ Unlimited offline listening',
          '✓ Ad-free experience',
          '✓ High quality audio (320kbps)',
          '✓ Skip unlimited songs',
          '✓ Priority support',
        ],
      },
      {
        id: 'pro',
        name: 'Creator Pro',
        description: 'For content creators and artists',
        monthlyPrice: 19.99,
        annualPrice: 199.99,
        targetSegment: 'pro',
        features: [
          '✓ All Premium features',
          '✓ Advanced analytics',
          '✓ Revenue sharing (20%)',
          '✓ Channel promotion tools',
          '✓ Weekly feature priority',
          '✓ Direct support line',
        ],
      },
    ];
  }

  /**
   * Calculate monetization potential
   */
  calculateMonetizationPotential(metrics: UserEngagementMetrics): {
    estimatedMonthlyValue: number;
    recommendedOffers: string[];
    conversionProbability: number;
  } {
    const baseValue =
      (metrics.totalMinutesListened * 0.001 + metrics.followers * 0.05 + metrics.contentCreated * 2) / 30;

    return {
      estimatedMonthlyValue: Math.round(baseValue * 100) / 100,
      recommendedOffers:
        metrics.engagementScore > 70
          ? ['premium_annual_discount', 'creator_pro_trial']
          : ['premium_free_trial', 'offline_listening_trial'],
      conversionProbability: Math.min((metrics.engagementScore + metrics.followers * 0.1) / 100, 1),
    };
  }
}

export const engagementAnalytics = new EngagementAnalyticsService();
