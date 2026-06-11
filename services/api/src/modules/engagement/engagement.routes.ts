import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { pool } from '../../db/pool';
import { engagementListQuerySchema } from '../me/me.schema';
import {
  getMeMetrics,
  getMeRecentlyPlayed,
  getMeRecommendations,
} from '../me/me.service';

const router = Router();

router.use(authenticate);

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  return req.user;
}

interface UserContextRow {
  created_at: string | Date;
  last_login_at: string | Date | null;
  content_count: string;
}

interface SessionMinutesRow {
  minutes: string;
}

const getUserContext = async (userId: string): Promise<UserContextRow> => {
  const result = await pool.query<UserContextRow>(
    `SELECT
       u.created_at,
       u.last_login_at,
       COUNT(c.id)::text AS content_count
     FROM app_users u
     LEFT JOIN content_items c ON c.author_id = u.id
     WHERE u.id = $1
     GROUP BY u.created_at, u.last_login_at`,
    [userId],
  );
  return result.rows[0] ?? { created_at: new Date(), last_login_at: null, content_count: '0' };
};

const getSessionMinutes = async (userId: string, windowDays?: number): Promise<number> => {
  try {
    const result = await pool.query<SessionMinutesRow>(
      windowDays
        ? `SELECT COALESCE(ROUND(SUM(LEAST(COALESCE(position_ms, 0), COALESCE(duration_ms, 0)))::numeric / 60000), 0)::text AS minutes
           FROM user_playback_sessions
           WHERE user_id = $1 AND started_at >= NOW() - ($2::text || ' days')::interval`
        : `SELECT COALESCE(ROUND(SUM(LEAST(COALESCE(position_ms, 0), COALESCE(duration_ms, 0)))::numeric / 60000), 0)::text AS minutes
           FROM user_playback_sessions
           WHERE user_id = $1`,
      windowDays ? [userId, windowDays] : [userId],
    );
    return Number(result.rows[0]?.minutes ?? '0');
  } catch {
    return 0;
  }
};

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
    const [metrics, recommendations, sessionMinutes, context] = await Promise.all([
      getMeMetrics(user),
      getMeRecommendations(user, { limit: 12, windowDays: 120 }),
      getSessionMinutes(user.sub),
      getUserContext(user.sub),
    ]);
    const score = engagementScore(metrics.totalPlays, metrics.liveSubscriptions);

    res.status(200).json({
      userId: user.sub,
      date: new Date().toISOString(),
      totalMinutesListened: sessionMinutes,
      contentCreated: Number(context.content_count),
      contentViews: metrics.totalPlays,
      followers: 0,
      following: metrics.liveSubscriptions,
      engagementScore: score,
      retentionScore: retentionScore(metrics.totalPlays, recommendations.items.length),
      conversionRiskLevel: riskLevel(score),
      lastActiveTime: context.last_login_at ? new Date(context.last_login_at).getTime() : Date.now(),
      joinedDate: new Date(context.created_at).getTime(),
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
    const windowDays = query.windowDays ?? 30;

    const [metrics, week, month, weekMinutes, monthMinutes] = await Promise.all([
      getMeMetrics(user),
      getMeRecentlyPlayed(user, { limit: 50, windowDays: 7 }),
      getMeRecentlyPlayed(user, { limit: 50, windowDays: windowDays }),
      getSessionMinutes(user.sub, 7),
      getSessionMinutes(user.sub, windowDays),
    ]);

    const score = engagementScore(metrics.totalPlays, metrics.liveSubscriptions);
    res.status(200).json({
      userId: user.sub,
      thisWeek: {
        minutesListened: weekMinutes,
        itemsPlayed: week.items.length,
        newFollowers: 0,
      },
      thisMonth: {
        minutesListened: monthMinutes,
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
