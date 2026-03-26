// app/(tabs)/dashboard.tsx
/**
 * Dashboard Screen
 * Main user dashboard with content feed, statistics, and quick actions
 * Beautiful, modern design with smooth animations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Container } from '../../components/Container';
import { AppButton } from '../../components/ui/AppButton';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { StatCard } from '../../components/ui/StatCard';
import { AnimatedScrollView } from '../../components/ui/AnimatedScrollView';
import { MaterialIcons } from '@expo/vector-icons';

interface DashboardStats {
  totalContentCreated: number;
  totalViews: number;
  totalFollowers: number;
  engagementRate: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'post' | 'music' | 'video';
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Simulate loading data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStats({
        totalContentCreated: 24,
        totalViews: 5234,
        totalFollowers: 342,
        engagementRate: '8.5%',
      });

      setRecentContent([
        {
          id: '1',
          title: 'New Music Release - Spring Collection',
          type: 'music',
          viewCount: 1250,
          likeCount: 234,
          createdAt: '2 days ago',
        },
        {
          id: '2',
          title: 'Behind the Scenes: Studio Session',
          type: 'video',
          viewCount: 856,
          likeCount: 145,
          createdAt: '5 days ago',
        },
        {
          id: '3',
          title: 'My Creative Journey So Far',
          type: 'post',
          viewCount: 542,
          likeCount: 89,
          createdAt: '1 week ago',
        },
      ]);

      setIsLoading(false);

      // Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    };

    loadData();
  }, [fadeAnim]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Container>
          <View style={{ paddingVertical: 24 }}>
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Container>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <CustomText style={styles.greeting}>Welcome Back!</CustomText>
              <CustomText style={[styles.subheading, { color: theme.colors.text.secondary }]}>
                Here&apos;s your creative summary
              </CustomText>
            </View>
            <MaterialIcons name="notifications" size={24} color={theme.colors.primary} />
          </View>

          {/* Statistics Section */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.statsSection}>
              <CustomText style={styles.sectionTitle}>Your Statistics</CustomText>
              
              <StatCard
                label="Total Content"
                value={stats?.totalContentCreated || 0}
                icon={<MaterialIcons name="video-library" size={20} color={theme.colors.primary} />}
                delay={100}
              />

              <StatCard
                label="Total Views"
                value={stats?.totalViews || 0}
                trend="up"
                trendValue="+12.5%"
                icon={<MaterialIcons name="visibility" size={20} color={theme.colors.primary} />}
                delay={200}
              />

              <StatCard
                label="Followers"
                value={stats?.totalFollowers || 0}
                trend="up"
                trendValue="+24"
                icon={<MaterialIcons name="people" size={20} color={theme.colors.primary} />}
                delay={300}
              />

              <StatCard
                label="Engagement Rate"
                value={stats?.engagementRate || '0%'}
                trend="up"
                trendValue="+2.1%"
                icon={<MaterialIcons name="trending-up" size={20} color={theme.colors.primary} />}
                backgroundColor={`${theme.colors.primary}15`}
                delay={400}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <CustomText style={styles.sectionTitle}>Quick Actions</CustomText>
              
              <View style={styles.actionsGrid}>
                <AppButton
                  title="Create Post"
                  onPress={() => {}}
                  variant="primary"
                  size="sm"
                  icon={<MaterialIcons name="edit" size={16} color="white" />}
                />
                <AppButton
                  title="Upload Music"
                  onPress={() => {}}
                  variant="secondary"
                  size="sm"
                  icon={<MaterialIcons name="cloud-upload" size={16} color={theme.colors.primary} />}
                />
                <AppButton
                  title="View Analytics"
                  onPress={() => {}}
                  variant="outline"
                  size="sm"
                  icon={<MaterialIcons name="analytics" size={16} color={theme.colors.primary} />}
                />
                <AppButton
                  title="Share Profile"
                  onPress={() => {}}
                  variant="ghost"
                  size="sm"
                  icon={<MaterialIcons name="share" size={16} color={theme.colors.primary} />}
                />
              </View>
            </View>

            {/* Recent Content */}
            <View style={[styles.recentSection, { marginBottom: 32 }]}>
              <CustomText style={styles.sectionTitle}>Recent Content</CustomText>
              
              {recentContent.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    marginBottom: index !== recentContent.length - 1 ? 12 : 0,
                  }}
                >
                  <ContentCard item={item} theme={theme} />
                </View>
              ))}
            </View>
          </Animated.View>
        </Container>
      </AnimatedScrollView>
    </SafeAreaView>
  );
}

/**
 * Content Card Component
 */
interface ContentCardProps {
  item: ContentItem;
  theme: any;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, theme }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'music':
        return theme.colors.primary;
      case 'video':
        return '#FF6B6B';
      case 'post':
        return '#4ECDC4';
      default:
        return theme.colors.text.secondary;
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'music':
        return 'music-note';
      case 'video':
        return 'videocam';
      case 'post':
        return 'article';
      default:
        return 'article';
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
      onTouchStart={onPressIn}
      onTouchEnd={onPressOut}
    >
      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.contentHeader}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: `${getTypeColor()}20` },
            ]}
          >
            <MaterialIcons
              name={getTypeIcon() as any}
              size={20}
              color={getTypeColor()}
            />
          </View>

          <View style={{ flex: 1 }}>
            <CustomText style={[styles.contentTitle, { color: theme.colors.text.primary }]}>
              {item.title}
            </CustomText>
            <CustomText style={[styles.contentDate, { color: theme.colors.text.secondary }]}>
              {item.createdAt}
            </CustomText>
          </View>
        </View>

        <View style={styles.contentStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={16} color={theme.colors.text.secondary} />
            <CustomText style={[styles.statText, { color: theme.colors.text.secondary }]}>
              {item.viewCount}
            </CustomText>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons name="favorite" size={16} color={theme.colors.danger} />
            <CustomText style={[styles.statText, { color: theme.colors.text.secondary }]}>
              {item.likeCount}
            </CustomText>
          </View>

          <View style={{ marginLeft: 'auto' }}>
            <MaterialIcons name="arrow-forward" size={20} color={theme.colors.primary} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '400',
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentSection: {
    marginTop: 24,
  },
  contentCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contentDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  contentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
