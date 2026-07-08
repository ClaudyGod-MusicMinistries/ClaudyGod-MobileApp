import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { EmptyState, PremiumPage, SectionLabel } from '../../components/feed';
import { useAuth } from './AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { wsService } from '../../services/websocketService';
import {
  fetchEngagementMetrics,
  fetchEngagementInsights,
  type EngagementMetrics,
  type EngagementInsight,
} from '../../services/engagementService';

function getInsightColor(type: string, theme: ReturnType<typeof useAppTheme>): string {
  const map: Record<string, string> = {
    warning:     theme.colors.danger,
    achievement: theme.colors.warning,
    opportunity: theme.colors.success,
    info:        theme.colors.primary,
  };
  return map[type] ?? theme.colors.primary;
}

const INSIGHT_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  warning:     'error-outline',
  achievement: 'emoji-events',
  opportunity: 'lightbulb-outline',
  info:        'star-half',
};

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string | number;
  accent?: string;
}) {
  const theme = useAppTheme();
  const color = accent ?? theme.colors.primary;
  return (
    <View
      style={{
        flex: 1, minHeight: 100,
        borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: theme.colors.subtleFill,
        padding: 16, gap: 8,
      }}
    >
      <View
        style={{
          width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
          backgroundColor: `${color}18`,
        }}
      >
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </CustomText>
      <CustomText variant="heading" style={{ color: theme.colors.text }}>
        {value}
      </CustomText>
    </View>
  );
}

function InsightRow({ insight, onPress, showDivider }: { insight: EngagementInsight; onPress: () => void; showDivider: boolean }) {
  const theme = useAppTheme();
  const color = getInsightColor(insight.type, theme);
  const iconName = INSIGHT_ICONS[insight.type] ?? 'star-half';

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 14,
          paddingVertical: 13,
          borderTopWidth: showDivider ? 1 : 0,
          borderTopColor: theme.colors.border,
        }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}18` }}>
          <MaterialIcons name={iconName} size={18} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
            {insight.title}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3, lineHeight: 17 }} numberOfLines={2}>
            {insight.description}
          </CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { isAuthenticated, accessToken, user } = useAuth();

  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [insights, setInsights] = useState<EngagementInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const m = await fetchEngagementMetrics().catch(() => null);
      const i = await fetchEngagementInsights().catch((): EngagementInsight[] => []);
      if (m) setMetrics(m);
      setInsights(i);
    } catch {
      showToast({ title: 'Dashboard unavailable', message: 'Your activity could not load right now.', tone: 'warning' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !accessToken) return;
    let active = true;
    wsService.connect(user.id, accessToken).then(() => {
      if (!active) return;
      wsService.subscribe('engagement', (data) => {
        setMetrics((prev) => (prev ? { ...prev, ...data } : null));
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [accessToken, isAuthenticated, user?.id]);

  const hoursListened = metrics ? (metrics.totalMinutesListened / 60).toFixed(1) : '--';
  const contentViews = metrics
    ? ((metrics.contentViews || 0) >= 1000
        ? `${((metrics.contentViews || 0) / 1000).toFixed(1)}K`
        : String(metrics.contentViews || 0))
    : '--';
  const numMetricCols = device.isTV ? 4 : device.isDesktop ? 4 : 2;

  return (
    <PremiumPage title="Your Activity" eyebrow="Dashboard" noBack refreshing={loading} onRefresh={load}>
      {!isAuthenticated ? (
        <EmptyState
          title="Sign in to see your activity"
          message="Your listening history, engagement score, and insights will appear here."
          actionLabel="Sign in"
          onAction={() => router.push(APP_ROUTES.auth.signIn)}
          icon="bar-chart"
        />
      ) : (
        <>
          {/* Engagement score card */}
          {metrics ? (
            <FadeIn>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <View>
                    <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                      Engagement score
                    </CustomText>
                    <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 4 }}>
                      {metrics.engagementScore}<CustomText variant="body" style={{ color: theme.colors.textSecondary }}>/100</CustomText>
                    </CustomText>
                  </View>
                  <View
                    style={{
                      width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: `${theme.colors.primary}14`, borderWidth: 1, borderColor: `${theme.colors.primary}28`,
                    }}
                  >
                    <MaterialIcons
                      name={metrics.engagementScore > 70 ? 'trending-up' : 'show-chart'}
                      size={26}
                      color={theme.colors.primary}
                    />
                  </View>
                </View>

                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, lineHeight: 17 }}>
                  {metrics.engagementScore > 70
                    ? 'Great listening pace — keep exploring content.'
                    : 'Keep streaming to grow your engagement score.'}
                </CustomText>

                <View style={{ height: 10, borderRadius: 999, backgroundColor: theme.colors.subtleFillMed, overflow: 'hidden' }}>
                  <View
                    style={{ height: '100%', width: `${Math.min(100, metrics.engagementScore)}%`, backgroundColor: theme.colors.primary }}
                  />
                </View>
              </SurfaceCard>
            </FadeIn>
          ) : null}

          {/* Metric tiles grid */}
          <FadeIn delay={80}>
            <View style={{ gap: 12 }}>
              <SectionLabel title="Statistics" accent="This month" subtitle="Your listening and engagement metrics" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {numMetricCols <= 2 ? (
                  <>
                    <View style={{ flex: 1, flexDirection: 'column', gap: 12 }}>
                      <MetricCard icon="headphones"     label="Hours listened" value={hoursListened}           accent="#8B5CF6" />
                      <MetricCard icon="people"         label="Followers"      value={metrics?.followers ?? '--'} accent="#60A5FA" />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'column', gap: 12 }}>
                      <MetricCard icon="visibility"     label="Content views"  value={contentViews}            accent="#34D399" />
                      <MetricCard icon="library-music"  label="Saved content"  value={metrics?.contentCreated ?? '--'} accent="#FBBF24" />
                    </View>
                  </>
                ) : (
                  <>
                    <MetricCard icon="headphones"    label="Hours listened" value={hoursListened}              accent="#8B5CF6" />
                    <MetricCard icon="visibility"    label="Content views"  value={contentViews}               accent="#34D399" />
                    <MetricCard icon="people"        label="Followers"      value={metrics?.followers ?? '--'}  accent="#60A5FA" />
                    <MetricCard icon="library-music" label="Saved content"  value={metrics?.contentCreated ?? '--'} accent="#FBBF24" />
                  </>
                )}
              </View>
            </View>
          </FadeIn>

          {/* Insights */}
          {insights.length > 0 ? (
            <FadeIn delay={130}>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
                <SectionLabel
                  title="Insights"
                  accent={`${insights.length} new`}
                  subtitle="Personalized suggestions based on your listening"
                />
                <View style={{ marginTop: 8 }}>
                  {insights.slice(0, device.isTV ? 8 : 5).map((insight, index) => (
                    <InsightRow
                      key={`${insight.title}-${index}`}
                      insight={insight}
                      onPress={() => { if (insight.actionRoute) router.push(insight.actionRoute as never); }}
                      showDivider={index > 0}
                    />
                  ))}
                </View>
              </SurfaceCard>
            </FadeIn>
          ) : null}

          <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
        </>
      )}
    </PremiumPage>
  );
}