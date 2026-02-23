import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        onScrollEndDrag={() => {
          if (!loading) return;
        }}
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(12,9,20,0.88)',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                    Library
                  </CustomText>
                  <CustomText variant="display" style={{ color: '#F8F7FC', marginTop: 4, fontSize: 19, lineHeight: 24 }}>
                    Your music and playlists
                  </CustomText>
                  <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 5 }}>
                    Spotify/Audiomack-style library shell connected to content feed and play analytics.
                  </CustomText>
                </View>
                <TVTouchable
                  onPress={refresh}
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
                  <MaterialIcons name="refresh" size={20} color="#EFE7FF" />
                </TVTouchable>
              </View>

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

          <FadeIn delay={90}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              contentContainerStyle={{ paddingTop: 12, paddingRight: 8 }}
            >
              {tabs.map((tab) => {
                const active = tab === activeTab;
                return (
                  <TVTouchable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={{
                      marginRight: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? 'rgba(216,194,255,0.3)' : 'rgba(255,255,255,0.1)',
                      backgroundColor: active ? 'rgba(154,107,255,0.14)' : 'rgba(255,255,255,0.03)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="caption" style={{ color: active ? '#F1E7FF' : '#CEC4E7' }}>
                      {tab}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </ScrollView>
          </FadeIn>

          <FadeIn delay={140}>
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

          <FadeIn delay={200}>
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
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
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
