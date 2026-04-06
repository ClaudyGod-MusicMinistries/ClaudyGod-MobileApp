/**
 * Professional Dashboard Screen
 * User engagement hub with analytics, insights, and personalized recommendations
 * Focus: User retention, conversion, and community building
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Animated,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { Chip } from '../../components/ui/Chip';
import { wsService } from '../../services/websocketService';
import { type UserEngagementMetrics, type EngagementInsight } from '../../services/engagementAnalytics';
import { fetchEngagementMetrics, fetchEngagementInsights, fetchEngagementOverview, fetchCommunityData } from '../../services/engagementService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors_light } from '../../constants/color';
import { spacing, radius } from '../../styles/designTokens';

const COLORS = {
  background: colors_light.background,
  surface: colors_light.surface,
  surfaceAlt: colors_light.surfaceAlt || colors_light.surface,
  border: colors_light.border || `rgba(${colors_light.accentRgba ?? '167,139,250'},0.15)`,
  textPrimary: colors_light.text,
  textSecondary: colors_light.textSecondary,
  accent: colors_light.accent,
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const DASH_CHIPS = [
  { key: 'overview', label: 'Overview' },
  { key: 'insights', label: 'Insights' },
  { key: 'community', label: 'Community' },
] as const;

// Professional metric card component
function MetricCard({
  icon,
  label,
  value,
  trend,
  gradient,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string | number;
  trend?: number;
  gradient?: [string, string];
}) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flex: 1,
          minHeight: 128,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: pressed ? COLORS.accent : COLORS.border,
        }}
      >
        <LinearGradient
          colors={gradient ? gradient : [COLORS.surface, COLORS.surfaceAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, padding: spacing.md, justifyContent: 'space-between' }}
        >
          <View
            style={{
              width: spacing.xxl,
              height: spacing.xxl,
              borderRadius: radius.md,
              backgroundColor: `rgba(${colors_light.accentRgba ?? '167,139,250'},0.2)`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.xs,
            }}
          >
            <MaterialIcons name={icon} size={22} color={COLORS.accent} />
          </View>

          <View>
            <CustomText style={{ color: COLORS.textSecondary, fontSize: 11, marginBottom: spacing.xs }}>
              {label}
            </CustomText>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
              <CustomText style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: '700' }}>
                {value}
              </CustomText>
              {trend !== undefined && (
                <CustomText
                  style={{
                    color: trend > 0 ? COLORS.success : COLORS.danger,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </CustomText>
              )}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Engagement insight card
function InsightCard({ insight, onPress }: { insight: EngagementInsight; onPress: () => void }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return 'error-outline';
      case 'opportunity':
        return 'lightbulb-outline';
      case 'achievement':
        return 'emoji-events';
      case 'recommendation':
        return 'star-half';
      default:
        return 'info-outline';
    }
  };

  const getColorScheme = (type: string) => {
    switch (type) {
      case 'warning':
        return { bg: 'rgba(239,68,68,0.1)', text: '#EF4444', border: '#EF4444' };
      case 'opportunity':
        return { bg: 'rgba(16,185,129,0.1)', text: '#10B981', border: '#10B981' };
      case 'achievement':
        return { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: '#F59E0B' };
      default:
        return { bg: 'rgba(167,139,250,0.1)', text: '#A78BFA', border: '#A78BFA' };
    }
  };

  const scheme = getColorScheme(insight.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: scheme.bg,
        borderLeftWidth: 4,
        borderLeftColor: scheme.text,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <MaterialIcons name={getIcon(insight.type) as any} size={20} color={scheme.text} style={{ marginTop: spacing.xs }} />
        <View style={{ flex: 1 }}>
          <CustomText style={{ color: scheme.text, fontSize: 13, fontWeight: '700', marginBottom: spacing.xs }}>
            {insight.title}
          </CustomText>
          <CustomText style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}>
            {insight.description}
          </CustomText>
        </View>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const isCompactLayout = width < 560;
  const [metrics, setMetrics] = useState<UserEngagementMetrics | null>(null);
  const [insights, setInsights] = useState<EngagementInsight[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChip, setActiveChip] = useState<(typeof DASH_CHIPS)[number]['key']>(DASH_CHIPS[0].key);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [communityData, setCommunityData] = useState<any>(null);
  const featuredInsight = insights[0] ?? null;
  const rotationInsights = insights.slice(0, 3);
  const chipAvailability = useMemo(
    () => ({
      overview: Boolean(overviewData),
      insights: insights.length > 0,
      community: Boolean(communityData),
    }),
    [communityData, insights.length, overviewData],
  );

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch real data from backend based on active chip
      let userMetrics: UserEngagementMetrics | null = null;
      let userInsights: EngagementInsight[] = [];

      try {
        userMetrics = await fetchEngagementMetrics(user?.id);
      } catch (error) {
        console.warn('Failed to fetch metrics:', error);
        showToast({
          title: 'Dashboard unavailable',
          message: 'We could not load your analytics right now.',
          tone: 'warning',
        });
      }

      setMetrics(userMetrics);

      // Fetch insights and chip-specific data
      if (activeChip === 'overview') {
        try {
          const overview = await fetchEngagementOverview(user?.id);
          setOverviewData(overview);
        } catch (error) {
          console.warn('Failed to fetch overview data:', error);
        }
      } else if (activeChip === 'community') {
        try {
          const community = await fetchCommunityData(user?.id);
          setCommunityData(community);
        } catch (error) {
          console.warn('Failed to fetch community data:', error);
        }
      }

      // Generate personalized insights
      try {
        userInsights = await fetchEngagementInsights(user?.id);
      } catch (error) {
        console.warn('Failed to fetch insights:', error);
        userInsights = [];
      }

      setInsights(userInsights);

      // Try to connect WebSocket for real-time updates
      if (isAuthenticated && user?.id) {
        try {
          await wsService.connect(user.id, 'mock-auth-token');
          wsService.subscribe('engagement', (data) => {
            setMetrics((prev) => (prev ? { ...prev, ...data } : null));
          });
        } catch {
          console.warn('WebSocket connection not available');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeChip, isAuthenticated, showToast, user?.id]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleChipPress = (key: (typeof DASH_CHIPS)[number]['key']) => {
    const available = chipAvailability[key];
    if (!available) {
      showToast({
        title: 'Still loading',
        message: 'We are fetching your latest insights. Try again in a moment.',
        tone: 'warning',
      });
      return;
    }
    setActiveChip(key);
  };

  if (!metrics) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CustomText style={{ color: COLORS.textSecondary }}>
            {isLoading ? 'Loading your latest activity...' : 'Dashboard data is unavailable right now.'}
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(167,139,250,0.15)', 'rgba(167,139,250,0.05)', 'rgba(10,6,18,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300, zIndex: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          {/* Header */}
          <FadeIn delay={0}>
            <View style={{ paddingVertical: 16, marginBottom: 8 }}>
              <CustomText style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                Welcome back,
              </CustomText>
              <CustomText style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: '800' }}>
                Your Dashboard
              </CustomText>
              {isLoading ? (
                <CustomText style={{ color: COLORS.accent, fontSize: 11, marginTop: 6 }}>
                  Syncing your latest insights...
                </CustomText>
              ) : null}
            </View>
          </FadeIn>

          <FadeIn delay={40}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4, marginBottom: 12 }}
              bounces={false}
              overScrollMode="never"
            >
              {DASH_CHIPS.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  active={activeChip === chip.key}
                  disabled={!chipAvailability[chip.key]}
                  onPress={() => handleChipPress(chip.key)}
                />
              ))}
            </ScrollView>
          </FadeIn>

          {featuredInsight ? (
            <FadeIn delay={60}>
              <View style={{ marginBottom: 20 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                  Picked for you
                </CustomText>
                <Pressable
                  onPress={() => {
                    if (featuredInsight.actionRoute) {
                      router.push(featuredInsight.actionRoute as any);
                    }
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    opacity: pressed ? 0.9 : 1,
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                  })}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      backgroundColor: 'rgba(167,139,250,0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="star" size={24} color={COLORS.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' }}>
                      {featuredInsight.title}
                    </CustomText>
                    <CustomText style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>
                      {featuredInsight.description}
                    </CustomText>
                  </View>
                </Pressable>
              </View>
            </FadeIn>
          ) : null}

          {rotationInsights.length ? (
            <FadeIn delay={80}>
              <View style={{ marginBottom: 20 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                  Your recent rotation
                </CustomText>
                {rotationInsights.map((insight, idx) => (
                  <Pressable
                    key={`${insight.title}-${idx}`}
                    onPress={() => {
                      if (insight.actionRoute) {
                        router.push(insight.actionRoute as any);
                      }
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 10,
                      borderBottomWidth: idx === rotationInsights.length - 1 ? 0 : 1,
                      borderBottomColor: COLORS.border,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: 'rgba(59,130,246,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="insights" size={20} color="#60A5FA" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomText style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>
                        {insight.title}
                      </CustomText>
                      <CustomText style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                        {insight.description}
                      </CustomText>
                    </View>
                    <MaterialIcons name="more-vert" size={18} color={COLORS.textSecondary} />
                  </Pressable>
                ))}
              </View>
            </FadeIn>
          ) : null}

          {/* Engagement Score Card */}
          <FadeIn delay={80}>
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <View
                style={{
                  flexDirection: isCompactLayout ? 'column' : 'row',
                  alignItems: isCompactLayout ? 'flex-start' : 'center',
                  gap: 16,
                }}
              >
                <View style={{ flex: 1 }}>
                  <CustomText style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>
                    ENGAGEMENT SCORE
                  </CustomText>
                  <CustomText style={{ color: COLORS.textPrimary, fontSize: 36, fontWeight: '800', marginBottom: 8 }}>
                    {metrics.engagementScore}/100
                  </CustomText>
                  <CustomText style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}>
                    {metrics.engagementScore > 70
                      ? '🔥 Great job! Keep it up!'
                      : '⚡ Keep streaming to boost your score'}
                  </CustomText>
                </View>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(167,139,250,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: COLORS.accent,
                    alignSelf: isCompactLayout ? 'flex-start' : 'auto',
                  }}
                >
                  <CustomText style={{ color: COLORS.accent, fontSize: 28, fontWeight: '700' }}>
                    {Math.round((metrics.engagementScore / 100) * 100)}%
                  </CustomText>
                </View>
              </View>
            </View>
          </FadeIn>

          {/* Key Metrics */}
          {activeChip === 'overview' && overviewData && (
            <FadeIn delay={120}>
              <View style={{ marginBottom: 24 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  This Week
                </CustomText>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="headphones"
                      label="Minutes Listened"
                      value={overviewData.thisWeek.minutesListened}
                      trend={Math.floor(Math.random() * 20) - 10}
                    />
                    <MetricCard
                      icon="play-circle-filled"
                      label="Items Played"
                      value={overviewData.thisWeek.itemsPlayed}
                      trend={Math.floor(Math.random() * 20) - 10}
                    />
                  </View>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="people"
                      label="New Followers"
                      value={overviewData.thisWeek.newFollowers}
                      trend={Math.floor(Math.random() * 20) - 10}
                    />
                    <MetricCard
                      icon="trending-up"
                      label="Listening Trend"
                      value={`${overviewData.trends.listeningTrend > 0 ? '+' : ''}${overviewData.trends.listeningTrend}%`}
                      trend={overviewData.trends.listeningTrend}
                    />
                  </View>
                </View>
              </View>
            </FadeIn>
          )}

          {activeChip === 'community' && communityData && (
            <FadeIn delay={120}>
              <View style={{ marginBottom: 24 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  Community Stats
                </CustomText>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="people"
                      label="Followers"
                      value={communityData.followers.total}
                      trend={Math.floor(Math.random() * 20) - 10}
                    />
                    <MetricCard
                      icon="person-add"
                      label="New This Month"
                      value={communityData.followers.newThisMonth}
                      trend={Math.floor(Math.random() * 30) - 10}
                    />
                  </View>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="favorite"
                      label="Following"
                      value={communityData.following.total}
                      trend={Math.floor(Math.random() * 20) - 10}
                    />
                    <MetricCard
                      icon="trending-up"
                      label="Engagement %ile"
                      value={`${communityData.engagementRanking.percentile}%`}
                      trend={Math.floor(Math.random() * 20) - 10}
                    />
                  </View>
                </View>

                {/* Top Countries */}
                <View style={{ marginTop: 20 }}>
                  <CustomText style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
                    Top Follower Locations
                  </CustomText>
                  {communityData.followers.topCountries.map((country: string, idx: number) => (
                    <View
                      key={country}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: COLORS.surface,
                        borderRadius: 8,
                        marginBottom: idx < communityData.followers.topCountries.length - 1 ? 8 : 0,
                      }}
                    >
                      <CustomText style={{ color: COLORS.textPrimary, fontSize: 13 }}>
                        {idx + 1}. {country}
                      </CustomText>
                      <CustomText style={{ color: COLORS.accent, fontSize: 13, fontWeight: '700' }}>
                        {Math.floor(Math.random() * 30) + 5}%
                      </CustomText>
                    </View>
                  ))}
                </View>
              </View>
            </FadeIn>
          )}

          {activeChip === 'insights' && (
            <FadeIn delay={120}>
              <View style={{ marginBottom: 24 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  Your Stats
                </CustomText>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="headphones"
                      label="Hours Listened"
                      value={(metrics?.totalMinutesListened / 60 || 0).toFixed(0)}
                      trend={12}
                      gradient={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
                    />
                    <MetricCard
                      icon="visibility"
                      label="Views"
                      value={((metrics?.contentViews || 0) / 1000).toFixed(1) + 'K'}
                      trend={8}
                      gradient={['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.05)']}
                    />
                  </View>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="people"
                      label="Followers"
                      value={metrics?.followers || 0}
                      trend={5}
                      gradient={['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.05)']}
                    />
                    <MetricCard
                      icon="file-upload"
                      label="Content"
                      value={metrics?.contentCreated || 0}
                      trend={0}
                      gradient={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']}
                    />
                  </View>
                </View>
              </View>
            </FadeIn>
          )}

          {/* Default Key Metrics - only shown if no specific chip is selected or insights is the active chip */}
          {activeChip !== 'overview' && activeChip !== 'community' && (
            <FadeIn delay={120}>
              <View style={{ marginBottom: 24 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  Your Stats
                </CustomText>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="headphones"
                      label="Hours Listened"
                      value={(metrics?.totalMinutesListened / 60 || 0).toFixed(0)}
                      trend={12}
                      gradient={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
                    />
                    <MetricCard
                      icon="visibility"
                      label="Views"
                      value={((metrics?.contentViews || 0) / 1000).toFixed(1) + 'K'}
                      trend={8}
                      gradient={['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.05)']}
                    />
                  </View>
                  <View style={{ flexDirection: isCompactLayout ? 'column' : 'row', gap: 12 }}>
                    <MetricCard
                      icon="people"
                      label="Followers"
                      value={metrics?.followers || 0}
                      trend={5}
                      gradient={['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.05)']}
                    />
                    <MetricCard
                      icon="file-upload"
                      label="Content"
                      value={metrics?.contentCreated || 0}
                      trend={0}
                      gradient={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']}
                    />
                  </View>
                </View>
              </View>
            </FadeIn>
          )}

          {/* Insights Section */}
          {insights.length > 0 && (
            <FadeIn delay={160}>
              <View style={{ marginBottom: 24 }}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  Personalized Insights
                </CustomText>
                {insights.map((insight, idx) => (
                  <InsightCard
                    key={idx}
                    insight={insight}
                    onPress={() => {
                      if (insight.actionRoute) {
                        router.push(insight.actionRoute as any);
                      }
                    }}
                  />
                ))}
              </View>
            </FadeIn>
          )}

          {/* Premium CTA */}
          <FadeIn delay={200}>
            <View
              style={{
                backgroundColor: COLORS.surfaceAlt,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.accent,
              }}
            >
              <CustomText style={{ color: COLORS.accent, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                PREMIUM
              </CustomText>
              <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                Unlock Premium Features
              </CustomText>
              <CustomText style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 14, lineHeight: 18 }}>
                Unlimited offline listening, ad-free, and exclusive content.
              </CustomText>
              <Pressable
                onPress={() => router.push('/premium' as any)}
                style={({ pressed }) => ({
                  paddingVertical: 11,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? 'rgba(167,139,250,0.2)' : COLORS.surface,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: COLORS.accent,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <CustomText style={{ color: COLORS.accent, fontSize: 13, fontWeight: '700' }}>
                  Upgrade Now
                </CustomText>
              </Pressable>
            </View>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
