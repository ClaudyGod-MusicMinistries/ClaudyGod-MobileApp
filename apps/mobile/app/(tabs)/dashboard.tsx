import React, { useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { SupportMinistryCard } from '../../components/ui/SupportMinistryCard';
import { EmptyState, PremiumPage } from '../../components/Exp/PremiumContent';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';
import { wsService } from '../../services/websocketService';
import {
  fetchEngagementMetrics,
  fetchEngagementInsights,
  type EngagementMetrics,
  type EngagementInsight,
} from '../../services/engagementService';

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string | number;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        minHeight: 90,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor:
          theme.scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(17,10,31,0.04)',
        padding: 14,
        gap: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            theme.scheme === 'dark' ? 'rgba(183,148,246,0.14)' : 'rgba(124,58,237,0.10)',
        }}
      >
        <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View>
        <CustomText
          variant="caption"
          style={{ color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          {label}
        </CustomText>
        <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 2 }}>
          {value}
        </CustomText>
      </View>
    </View>
  );
}

function InsightRow({
  insight,
  onPress,
  isLast,
}: {
  insight: EngagementInsight;
  onPress: () => void;
  isLast: boolean;
}) {
  const theme = useAppTheme();

  const accentColor =
    insight.type === 'warning' ? theme.colors.danger :
    insight.type === 'achievement' ? theme.colors.warning :
    insight.type === 'opportunity' ? theme.colors.success :
    theme.colors.primary;

  const iconName: React.ComponentProps<typeof MaterialIcons>['name'] =
    insight.type === 'warning' ? 'error-outline' :
    insight.type === 'achievement' ? 'emoji-events' :
    insight.type === 'opportunity' ? 'lightbulb-outline' :
    'star-half';

  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          borderTopWidth: isLast ? 0 : 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${accentColor}18`,
          }}
        >
          <MaterialIcons name={iconName} size={17} color={accentColor} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
            {insight.title}
          </CustomText>
          <CustomText
            variant="caption"
            style={{ color: theme.colors.textSecondary, marginTop: 3, lineHeight: 17 }}
            numberOfLines={2}
          >
            {insight.description}
          </CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textSecondary} />
      </View>
    </TVTouchable>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { showToast } = useToast();
  const { isAuthenticated, accessToken, user } = useAuth();
  const twoCol = width >= 560;

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

  useEffect(() => {
    void load();
  }, [load]);

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
  const contentViews = metrics ? ((metrics.contentViews || 0) >= 1000 ? `${((metrics.contentViews || 0) / 1000).toFixed(1)}K` : String(metrics.contentViews || 0)) : '--';

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
          {metrics ? (
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md, gap: 12 }}>
              <View>
                <CustomText
                  variant="caption"
                  style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}
                >
                  Engagement
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 4 }}>
                  Score: {metrics.engagementScore}/100
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
                  {metrics.engagementScore > 70 ? 'Great listening pace. Keep it up.' : 'Keep streaming to grow your engagement.'}
                </CustomText>
              </View>

              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(17,10,31,0.07)',
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={theme.colors.gradient.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(100, metrics.engagementScore)}%` }}
                />
              </View>
            </SurfaceCard>
          ) : null}

          <View style={{ flexDirection: twoCol ? 'row' : 'column', gap: 10 }}>
            <MetricTile icon="headphones" label="Hours listened" value={hoursListened} />
            <MetricTile icon="visibility" label="Content views" value={contentViews} />
          </View>

          <View style={{ flexDirection: twoCol ? 'row' : 'column', gap: 10 }}>
            <MetricTile icon="people" label="Followers" value={metrics?.followers ?? '--'} />
            <MetricTile icon="library-music" label="Content saved" value={metrics?.contentCreated ?? '--'} />
          </View>

          {insights.length ? (
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
              <CustomText variant="title" style={{ color: theme.colors.text, marginBottom: 4 }}>
                Insights
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 17 }}>
                Personalized suggestions based on your listening.
              </CustomText>
              <View>
                {insights.slice(0, 5).map((insight, index) => (
                  <InsightRow
                    key={`${insight.title}-${index}`}
                    insight={insight}
                    onPress={() => { if (insight.actionRoute) router.push(insight.actionRoute as never); }}
                    isLast={index === 0}
                  />
                ))}
              </View>
            </SurfaceCard>
          ) : null}

          <SupportMinistryCard onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
        </>
      )}
    </PremiumPage>
  );
}
