import React, { useMemo, useState } from 'react';
import { Share, View, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { SearchBar } from '../../components/ui/SearchBar';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { ActionSheet, type ActionSheetAction } from '../../components/ui/ActionSheet';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useToast } from '../../context/ToastContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { saveMeLibraryItem, subscribeToLiveAlertsBackend } from '../../services/userFlowService';
import { APP_ROUTES } from '../../util/appRoutes';
import { getDiscoveryCategories, getDiscoveryShortcuts } from '../../util/mobileExperienceConfig';
import { buildPlayerRoute } from '../../util/playerRoute';
import { useAuth } from '../../context/AuthContext';
import type { FeedCardItem } from '../../services/contentService';

export default function Search() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDark = theme.scheme === 'dark';
  const isTablet = width >= 768;
  const shortcutWidth = isTablet ? '31.8%' : '48%';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [activeActionItem, setActiveActionItem] = useState<FeedCardItem | null>(null);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();

  const allItems = useMemo(
    () => [
      ...feed.music,
      ...feed.videos,
      ...feed.playlists,
      ...feed.live,
      ...feed.announcements,
      ...feed.mostPlayed,
    ],
    [feed.announcements, feed.live, feed.mostPlayed, feed.music, feed.playlists, feed.videos],
  );

  const discoveryCategories = useMemo(
    () => getDiscoveryCategories(mobileConfig, feed.topCategories),
    [feed.topCategories, mobileConfig],
  );
  const quickShortcuts = useMemo(() => getDiscoveryShortcuts(mobileConfig), [mobileConfig]);
  const discoverStack = useMemo(
    () => [...feed.music, ...feed.videos, ...feed.playlists, ...feed.live].slice(0, 8),
    [feed.live, feed.music, feed.playlists, feed.videos],
  );
  const browsePalette = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesText =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, allItems, query]);

  const formatMeta = (item: (typeof filtered)[number]) =>
    [item.subtitle, item.duration].filter((value) => Boolean(value)).join(' · ');

  const openResult = async (item: (typeof filtered)[number]) => {
    if (query.trim()) {
      setRecentQueries((current) => [query.trim(), ...current.filter((entry) => entry !== query.trim())].slice(0, 5));
    }
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source: 'search_results',
    });
    router.push(buildPlayerRoute(item));
  };

  const openMoreForItem = (item: (typeof filtered)[number]) => {
    setActiveActionItem(item);
    setIsActionSheetVisible(true);
  };

  const shareActive = async () => {
    if (!activeActionItem) return;
    try {
      await Share.share({
        message: `${activeActionItem.title}\n${activeActionItem.subtitle}${activeActionItem.mediaUrl ? `\n${activeActionItem.mediaUrl}` : ''}`,
      });
    } catch {
      showToast({
        title: 'Share unavailable',
        message: 'Try again in a moment.',
        tone: 'warning',
      });
    }
  };

  const saveToLibrary = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to save items to your library.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'liked',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'search_action_sheet' },
      });
      showToast({
        title: 'Saved to Library',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Save unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const listenLater = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to use Listen Later.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'playlist',
        playlistName: 'Listen Later',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'search_action_sheet' },
      });
      showToast({
        title: 'Added to Listen Later',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Listen later unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const followActiveLive = async () => {
    if (!activeActionItem) return;
    try {
      await subscribeToLiveAlertsBackend(activeActionItem.notificationChannelId || activeActionItem.id, activeActionItem.title);
      showToast({
        title: 'Live alerts enabled',
        message: `You will be notified when ${activeActionItem.title} goes live.`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Live alerts unavailable',
        message: 'Sign in to follow live sessions.',
        tone: 'warning',
      });
    }
  };

  const openReviews = () => {
    router.push(APP_ROUTES.settingsPages.rate);
  };

  const actionSheetActions: ActionSheetAction[] = !activeActionItem
    ? []
    : [
        {
          key: 'save',
          label: 'Save to Library',
          detail: 'Keep this item in your library.',
          icon: 'bookmark-border',
          onPress: () => void saveToLibrary(),
        },
        {
          key: 'share',
          label: 'Share',
          detail: 'Send this to someone else.',
          icon: 'ios-share',
          onPress: () => void shareActive(),
        },
        {
          key: 'listen-later',
          label: 'Listen Later',
          detail: 'Save this for later.',
          icon: 'schedule',
          onPress: () => void listenLater(),
        },
        {
          key: 'reviews',
          label: 'Reviews & Ratings',
          detail: 'See what others are saying.',
          icon: 'reviews',
          onPress: openReviews,
        },
        ...(activeActionItem.type === 'live'
          ? [
              {
                key: 'follow-live',
                label: 'Follow Live Alerts',
                detail: 'Get notified before the stream starts.',
                icon: 'notifications-active',
                onPress: () => void followActiveLive(),
              } as ActionSheetAction,
            ]
          : []),
        {
          key: 'open-detail',
          label: 'Open Player',
          detail: 'Open the full player screen.',
          icon: 'open-in-full',
          tone: 'accent' as const,
          onPress: () => {
            router.push(buildPlayerRoute(activeActionItem));
          },
        },
      ];

  const applyRecentSearch = () => {
    const recent = recentQueries[0];
    if (!recent) {
      showToast({
        title: 'No recent searches',
        message: 'Search for music, videos, or messages first.',
        tone: 'info',
      });
      return;
    }

    setQuery(recent);
    setActiveCategory('All');
  };

  const cycleCategory = () => {
    const currentIndex = discoveryCategories.indexOf(activeCategory as (typeof discoveryCategories)[number]);
    const nextCategory = discoveryCategories[(currentIndex + 1) % discoveryCategories.length] ?? 'All';
    setActiveCategory(nextCategory);
    showToast({
      title: 'Filter updated',
      message: `Showing ${nextCategory === 'All' ? 'all results' : nextCategory} results.`,
      tone: 'info',
      durationMs: 1800,
    });
  };

  const handleSubmitSearch = () => {
    const normalized = query.trim();
    if (!normalized) {
      showToast({
        title: 'Search is empty',
        message: 'Enter a title, artist, or topic.',
        tone: 'warning',
      });
      return;
    }

    setRecentQueries((current) => [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, 5));
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        stickyHeaderIndices={[0]}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View
          style={{
            backgroundColor: isDark ? '#06040D' : theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
          }}
        >
          <Screen>
            <FadeIn>
              <View
                style={{
                  paddingTop: theme.layout.headerVerticalPadding,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <BrandedHeaderCard
                  title="Search"
                  subtitle="Find music, videos and playlists"
                  actions={[
                    { icon: 'history', onPress: applyRecentSearch, accessibilityLabel: 'Recent searches' },
                    { icon: 'tune', onPress: cycleCategory, accessibilityLabel: 'Search filters' },
                    { icon: 'person-outline', onPress: () => router.push(APP_ROUTES.profile), accessibilityLabel: 'Profile' },
                  ]}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap }}>
            <FadeIn>
              <View style={{ gap: theme.spacing.sm }}>
                <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSubmitSearch} />
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                  Try artists, sermons, playlists, or live sessions.
                </CustomText>
              </View>
            </FadeIn>

            <FadeIn delay={90}>
              <View style={{ marginTop: theme.spacing.lg }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
                  Discover something new
                </CustomText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingTop: theme.spacing.sm,
                    paddingRight: theme.spacing.md,
                  }}
                  overScrollMode="never"
                >
                  <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                    {discoverStack.map((item) => (
                      <PosterCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        title={item.title}
                        meta={formatMeta(item)}
                        size="sm"
                        onPress={() => void openResult(item)}
                        showMore
                        onMorePress={() => openMoreForItem(item)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            </FadeIn>

            <FadeIn delay={140}>
              <View style={{ marginTop: theme.spacing.lg }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
                  Browse all
                </CustomText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                  {quickShortcuts.map((shortcut, index) => (
                    <TVTouchable
                      key={shortcut.label}
                      onPress={() => {
                        setQuery(shortcut.query);
                        setActiveCategory(shortcut.category);
                        showToast({
                          title: 'Filter applied',
                          message: `Showing ${shortcut.label.toLowerCase()}.`,
                          tone: 'info',
                          durationMs: 1400,
                        });
                      }}
                      style={{
                        width: shortcutWidth,
                        borderRadius: theme.radius.lg,
                        backgroundColor: browsePalette[index % browsePalette.length],
                        padding: theme.spacing.md,
                        minHeight: 96,
                        justifyContent: 'space-between',
                      }}
                      showFocusBorder={false}
                    >
                      <MaterialIcons name={shortcut.icon as any} size={20} color="#fff" />
                      <CustomText variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
                        {shortcut.label}
                      </CustomText>
                    </TVTouchable>
                  ))}
                </View>
              </View>
            </FadeIn>

            <FadeIn delay={200}>
            <MediaRail
              title="Results"
              actionLabel={`${filtered.length} found`}
              data={filtered}
              renderItem={(item) => (
                <PosterCard
                  key={item.id}
                  imageUrl={item.imageUrl}
                  title={item.title}
                  meta={formatMeta(item)}
                  size="sm"
                  onPress={() => void openResult(item)}
                  showMore
                  onMorePress={() => openMoreForItem(item)}
                />
              )}
            />
          </FadeIn>

            {!filtered.length ? (
              <FadeIn delay={260}>
                <SurfaceCard style={{ padding: theme.spacing.lg }}>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
                    No matches found
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                    Try a broader keyword or reset your active category.
                  </CustomText>
                  <View style={{ marginTop: theme.spacing.md }}>
                    <AppButton
                      title="Reset filters"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onPress={() => {
                        setActiveCategory('All');
                        setQuery('');
                      }}
                    />
                  </View>
                </SurfaceCard>
              </FadeIn>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
      <ActionSheet
        visible={isActionSheetVisible}
        title={activeActionItem?.title ?? 'Content options'}
        description={activeActionItem?.subtitle}
        actions={actionSheetActions}
        onClose={() => setIsActionSheetVisible(false)}
      />
    </TabScreenWrapper>
  );
}
