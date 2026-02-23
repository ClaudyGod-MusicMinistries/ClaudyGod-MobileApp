import React, { useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TabScreenWrapper } from './TextWrapper';
import { Screen } from '../../components/layout/Screen';
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
            backgroundColor: '#06040D',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(154,107,255,0.06)', 'rgba(6,4,13,0)']}
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
                  borderColor: 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(12,9,20,0.88)',
                  padding: 16,
                }}
              >
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                  Library Overview
                </CustomText>
                <CustomText variant="caption" style={{ color: 'rgba(176,167,202,0.9)', marginTop: 4 }}>
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
                        borderColor: 'rgba(255,255,255,0.08)',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        padding: 10,
                      }}
                    >
                      <CustomText variant="subtitle" style={{ color: '#F8F7FC' }}>
                        {stat.value}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 2 }}>
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
                  borderColor: 'rgba(255,255,255,0.07)',
                  backgroundColor: 'rgba(12,9,20,0.76)',
                  padding: 12,
                }}
              >
                <CustomText variant="label" style={{ color: '#F8F7FC' }}>
                  Downloads and offline mode
                </CustomText>
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }}>
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
}: {
  activeTab: LibraryTab;
  onChangeTab: (_tab: LibraryTab) => void;
  onRefresh: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <View>
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(10,8,17,0.88)',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Image
                source={require('../../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 30, height: 30, borderRadius: 15 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                ClaudyGod Ministries
              </CustomText>
              <CustomText variant="display" style={{ color: '#F8F7FC', marginTop: 2, fontSize: 17, lineHeight: 22 }}>
                Library
              </CustomText>
              <CustomText variant="caption" style={{ color: 'rgba(176,167,202,0.9)', marginTop: 3 }} numberOfLines={1}>
                Liked songs • Downloads • Playlists • History
              </CustomText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <HeaderIcon icon="refresh" onPress={onRefresh} />
            <HeaderIcon icon="person-outline" onPress={onOpenProfile} />
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 2, paddingRight: 8 }}
      >
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <TVTouchable
              key={tab}
              onPress={() => onChangeTab(tab)}
              style={{
                marginRight: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? 'rgba(216,194,255,0.34)' : 'rgba(255,255,255,0.1)',
                backgroundColor: active ? 'rgba(154,107,255,0.16)' : 'rgba(255,255,255,0.03)',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              showFocusBorder={false}
            >
              <CustomText variant="caption" style={{ color: active ? '#EFE3FF' : '#CEC4E7' }}>
                {tab}
              </CustomText>
            </TVTouchable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function HeaderIcon({ icon, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void }) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={20} color="#EFE7FF" />
    </TVTouchable>
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
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        minHeight: compact ? 68 : 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(12,9,20,0.84)',
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: '#F8F7FC' }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <CustomText variant="caption" style={{ color: 'rgba(171,162,198,0.9)' }}>
          {item.duration || '--:--'}
        </CustomText>
        <MaterialIcons name="more-vert" size={18} color="rgba(171,162,198,0.9)" />
      </View>
    </TVTouchable>
  );
}

function EmptyLibraryState({ tab, loading }: { tab: LibraryTab; loading: boolean }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(12,9,20,0.76)',
        padding: 12,
      }}
    >
      <CustomText variant="label" style={{ color: '#F8F7FC' }}>
        {loading ? 'Loading library...' : `${tab} is empty`}
      </CustomText>
      <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }}>
        {loading
          ? 'Fetching content from the feed service.'
          : 'This section will fill automatically when users start playing or saving content.'}
      </CustomText>
    </View>
  );
}
