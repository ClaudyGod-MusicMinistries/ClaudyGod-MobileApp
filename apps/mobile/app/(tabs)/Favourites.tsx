import React, { useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TabScreenWrapper } from './TextWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';

const tabs = ['Liked Songs', 'Downloaded', 'Playlists', 'History'] as const;
type LibraryTab = (typeof tabs)[number];

export default function LibraryScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [activeTab, setActiveTab] = useState<LibraryTab>('Liked Songs');
  const { feed, loading, refresh } = useContentFeed();

  const listItems = useMemo(() => {
    switch (activeTab) {
      case 'Downloaded':
        return feed.music.slice(0, 12);
      case 'Playlists':
        return feed.playlists.slice(0, 12);
      case 'History':
        return feed.recent.slice(0, 12);
      case 'Liked Songs':
      default:
        return (feed.mostPlayed.length ? feed.mostPlayed : feed.music).slice(0, 12);
    }
  }, [activeTab, feed]);

  const quickStats = [
    { label: 'Liked', value: `${feed.music.length}` },
    { label: 'Playlists', value: `${feed.playlists.length}` },
    { label: 'Recent', value: `${feed.recent.length}` },
  ];

  const ui = {
    stickyBg: isDark ? '#06040D' : theme.colors.background,
    stickyBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
    stickyGlow: isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)',
    overviewBg: isDark ? 'rgba(12,9,20,0.88)' : theme.colors.surface,
    overviewBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    overviewMuted: isDark ? 'rgba(194,185,220,0.9)' : theme.colors.text.secondary,
    overviewSubtle: isDark ? 'rgba(176,167,202,0.9)' : theme.colors.text.secondary,
    statBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    statBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.06)',
    footerPanelBg: isDark ? 'rgba(12,9,20,0.76)' : theme.colors.surface,
    footerPanelBorder: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
  } as const;

  const onOpen = async (item: FeedCardItem) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: 'library' });
    router.push('/(tabs)/PlaySection');
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <View
          style={{
            backgroundColor: ui.stickyBg,
            borderBottomWidth: 1,
            borderBottomColor: ui.stickyBorder,
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[ui.stickyGlow, 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Screen>
            <FadeIn>
              <View style={{ paddingTop: theme.spacing.md, paddingBottom: 12 }}>
                <LibraryHeader
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  onRefresh={refresh}
                  onOpenProfile={() => router.push('/profile')}
                  onOpenHome={() => router.push('/(tabs)/home')}
                  onOpenMenu={() => router.push('/(tabs)/Settings')}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: 14 }}>
            <FadeIn delay={70}>
              <View
                style={{
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: ui.overviewBorder,
                  backgroundColor: ui.overviewBg,
                  padding: 16,
                }}
              >
                <CustomText variant="caption" style={{ color: ui.overviewMuted }}>
                  Library Overview
                </CustomText>
                <CustomText variant="caption" style={{ color: ui.overviewSubtle, marginTop: 4 }}>
                  Spotify/Audiomack-style library shell connected to content feed and play analytics.
                </CustomText>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  {quickStats.map((stat) => (
                    <View
                      key={stat.label}
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: ui.statBorder,
                        backgroundColor: ui.statBg,
                        padding: 10,
                      }}
                    >
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                        {stat.value}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                        {stat.label}
                      </CustomText>
                    </View>
                  ))}
                </View>
              </View>
            </FadeIn>

            <FadeIn delay={120}>
              <View style={{ marginTop: 12, gap: 10 }}>
                {listItems.length ? (
                  listItems.map((item, index) => (
                    <LibraryRow
                      key={`${activeTab}-${item.id}-${index}`}
                      item={item}
                      onPress={() => onOpen(item)}
                      compact={!isTablet}
                    />
                  ))
                ) : (
                  <EmptyLibraryState tab={activeTab} loading={loading} />
                )}
              </View>
            </FadeIn>

            <FadeIn delay={180}>
              <View
                style={{
                  marginTop: 18,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: ui.footerPanelBorder,
                  backgroundColor: ui.footerPanelBg,
                  padding: 12,
                }}
              >
                <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                  Downloads and offline mode
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  UI structure is ready. Connect your download storage layer and Supabase user tables to persist offline items per account.
                </CustomText>
              </View>
            </FadeIn>
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function LibraryHeader({
  activeTab,
  onChangeTab,
  onRefresh,
  onOpenProfile,
  onOpenHome,
  onOpenMenu,
}: {
  activeTab: LibraryTab;
  onChangeTab: (_tab: LibraryTab) => void;
  onRefresh: () => void;
  onOpenProfile: () => void;
  onOpenHome: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <BrandedHeaderCard
      title="Library"
      subtitle="Liked songs • Downloads • Playlists • History"
      actions={[
        { icon: 'home', onPress: onOpenHome, accessibilityLabel: 'Open home' },
        { icon: 'refresh', onPress: onRefresh, accessibilityLabel: 'Refresh library' },
        { icon: 'person-outline', onPress: onOpenProfile, accessibilityLabel: 'Open profile' },
        { icon: 'more-horiz', onPress: onOpenMenu, accessibilityLabel: 'More options' },
      ]}
      chips={tabs.map((tab) => ({
        label: tab,
        active: tab === activeTab,
        onPress: () => onChangeTab(tab),
      }))}
    />
  );
}

function LibraryRow({
  item,
  onPress,
  compact,
}: {
  item: FeedCardItem;
  onPress: () => void;
  compact: boolean;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: compact ? 68 : 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.84)' : theme.colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12, marginRight: 10, backgroundColor: isDark ? '#140F20' : theme.colors.surfaceAlt }} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
          {item.duration || '--:--'}
        </CustomText>
        <MaterialIcons name="more-vert" size={18} color={theme.colors.text.secondary} />
      </View>
    </TVTouchable>
  );
}

function EmptyLibraryState({ tab, loading }: { tab: LibraryTab; loading: boolean }) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.76)' : theme.colors.surface,
        padding: 12,
      }}
    >
      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
        {loading ? 'Loading library...' : `${tab} is empty`}
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
        {loading
          ? 'Fetching content from the feed service.'
          : 'This section will fill automatically when users start playing or saving content.'}
      </CustomText>
    </View>
  );
}
