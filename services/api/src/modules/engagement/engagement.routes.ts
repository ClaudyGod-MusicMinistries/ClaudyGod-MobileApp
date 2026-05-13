import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { engagementListQuerySchema } from '../me/me.schema';
import {
  getMeMetrics,
  getMeMostPlayed,
  getMeRecentlyPlayed,
  getMeRecommendations,
} from '../me/me.service';

const router = Router();

router.use(authenticate);

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return req.user;
}

function estimateMinutes(totalPlays: number): number {
  return totalPlays * 4;
}

function engagementScore(totalPlays: number, liveSubscriptions: number): number {
  return Math.min(100, Math.round(totalPlays * 2.4 + liveSubscriptions * 8));
}

function retentionScore(totalPlays: number, recommendationCount: number): number {
  return Math.min(100, Math.round(totalPlays * 1.7 + recommendationCount * 5));
}

function riskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'low';
  if (score >= 35) return 'medium';
  return 'high';
}

router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const [metrics, recommendations] = await Promise.all([
      getMeMetrics(user),
      getMeRecommendations(user, { limit: 12, windowDays: 120 }),
    ]);
    const score = engagementScore(metrics.totalPlays, metrics.liveSubscriptions);

    res.status(200).json({
      userId: user.sub,
      date: new Date().toISOString(),
      totalMinutesListened: estimateMinutes(metrics.totalPlays),
      contentCreated: 0,
      contentViews: metrics.totalPlays,
      followers: 0,
      following: metrics.liveSubscriptions,
      engagementScore: score,
      retentionScore: retentionScore(metrics.totalPlays, recommendations.items.length),
      conversionRiskLevel: riskLevel(score),
      lastActiveTime: Date.now(),
      joinedDate: Date.now(),
    });
  }),
);

router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const [metrics, recommendations, recentlyPlayed] = await Promise.all([
      getMeMetrics(user),
      getMeRecommendations(user, { limit: 6, windowDays: 120 }),
      getMeRecentlyPlayed(user, { limit: 3, windowDays: 30 }),
    ]);

    const score = engagementScore(metrics.totalPlays, metrics.liveSubscriptions);
    const insights = [
      metrics.totalPlays > 0
        ? {
            id: 'listening-progress',
            type: 'achievement' as const,
            title: 'Listening progress',
            description: `You have played ${metrics.totalPlays} item${metrics.totalPlays === 1 ? '' : 's'} on this account.`,
            priority: score >= 70 ? ('high' as const) : ('medium' as const),
            actionRoute: '/(tabs)/library',
          }
        : {
            id: 'start-listening',
            type: 'opportunity' as const,
            title: 'Start your library',
            description: 'Play music, videos, or live sessions to unlock a more personal experience.',
            priority: 'high' as const,
            actionRoute: '/(tabs)/home',
          },
      recommendations.items.length > 0
        ? {
            id: 'personalized-recommendations',
            type: 'recommendation' as const,
            title: 'Recommended for you',
            description: `${recommendations.items.length} recommendation${recommendations.items.length === 1 ? '' : 's'} are ready from your listening history.`,
            priority: 'medium' as const,
            actionRoute: '/(tabs)/search',
          }
        : {
            id: 'build-signal',
            type: 'opportunity' as const,
            title: 'Build your recommendations',
            description: 'Listen to more content so the app can tune recommendations to your account.',
            priority: 'medium' as const,
            actionRoute: '/(tabs)/player',
          },
      {
        id: 'recent-activity',
        type: recentlyPlayed.items.length ? ('achievement' as const) : ('opportunity' as const),
        title: recentlyPlayed.items.length ? 'Recent activity saved' : 'No recent plays yet',
        description: recentlyPlayed.items.length
          ? 'Your recent listening history is synced to your account.'
          : 'Play a track or video to start syncing your account history.',
        priority: 'low' as const,
        actionRoute: '/(tabs)/library',
      },
    ];

    res.status(200).json(insights);
  }),
);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const query = validateSchema(engagementListQuerySchema, req.query);
    const [metrics, week, month] = await Promise.all([
      getMeMetrics(user),
      getMeRecentlyPlayed(user, { limit: 50, windowDays: 7 }),
      getMeRecentlyPlayed(user, { limit: 50, windowDays: query.windowDays ?? 30 }),
    ]);

    const score = engagementScore(metrics.totalPlays, metrics.liveSubscriptions);
    res.status(200).json({
      userId: user.sub,
      thisWeek: {
        minutesListened: estimateMinutes(week.items.length),
        itemsPlayed: week.items.length,
        newFollowers: 0,
      },
      thisMonth: {
        minutesListened: estimateMinutes(month.items.length),
        itemsPlayed: month.items.length,
        newFollowers: 0,
      },
      trends: {
        listeningTrend: Math.max(-50, Math.min(50, week.items.length - Math.ceil(month.items.length / 4))),
        followerTrend: 0,
        engagementTrend: Math.max(-50, Math.min(50, score - 50)),
      },
    });
  }),
);

router.get(
  '/community',
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const metrics = await getMeMetrics(user);

    res.status(200).json({
      userId: user.sub,
      followers: {
        total: 0,
        newThisMonth: 0,
        topCountries: [],
      },
      following: {
        total: metrics.liveSubscriptions,
        categories: {
          worship: 0,
          teaching: 0,
          music: 0,
          live: metrics.liveSubscriptions,
        },
      },
      engagementRanking: {
        position: 0,
        percentile: engagementScore(metrics.totalPlays, metrics.liveSubscriptions),
      },
    });
  }),
);

export default router;
