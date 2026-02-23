import React, { useMemo, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';

const videoFilters = ['All', 'Live', 'Music Videos', 'Messages', 'Worship', 'Shorts'];

export default function VideosScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const columns = isTablet ? 3 : 2;
  const [filter, setFilter] = useState('All');

  const { feed, loading, refresh, error } = useContentFeed();

  const videos = useMemo(() => {
    const base = [...feed.live, ...feed.videos];
    if (filter === 'Live') return feed.live;
    if (filter === 'Music Videos') return base.filter((item) => /music|worship/i.test(`${item.title} ${item.subtitle}`));
    if (filter === 'Messages') return base.filter((item) => /message|truth|word|sermon/i.test(`${item.title} ${item.description}`));
    if (filter === 'Worship') return base.filter((item) => /worship|praise/i.test(`${item.title} ${item.description}`));
    return base;
  }, [feed.live, feed.videos, filter]);

  const featuredVideo = videos[0] ?? feed.featured ?? null;

  const openVideo = async (item: FeedCardItem, source = 'videos_grid') => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
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
        <Screen>
          <FadeIn>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                  Video Hub
                </CustomText>
                <CustomText variant="display" style={{ color: '#F8F7FC', marginTop: 4, fontSize: 19, lineHeight: 24 }}>
                  Videos, Live and Replays
                </CustomText>
              </View>
              <TVTouchable
                onPress={() => router.push('/(tabs)/home')}
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
                <MaterialIcons name="home" size={20} color="#EFE7FF" />
              </TVTouchable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              contentContainerStyle={{ paddingTop: 12, paddingRight: 8 }}
            >
              {videoFilters.map((label) => {
                const active = label === filter;
                return (
                  <TVTouchable
                    key={label}
                    onPress={() => setFilter(label)}
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
                      {label}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </ScrollView>
          </FadeIn>

          <FadeIn delay={90}>
            <View
              style={{
                marginTop: 12,
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.09)',
                backgroundColor: 'rgba(12,9,20,0.88)',
              }}
            >
              <View style={{ height: 210 }}>
                {featuredVideo?.imageUrl ? (
                  <Image source={{ uri: featuredVideo.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={['#21113E', '#100B1E', '#0A0712']} style={{ width: '100%', height: '100%' }} />
                )}
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,4,13,0.9)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              </View>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 }} />
                    <CustomText variant="caption" style={{ color: '#FCA5A5' }}>
                      LIVE / FEATURED
                    </CustomText>
                  </View>
                  <CustomText variant="caption" style={{ color: 'rgba(224,214,247,0.9)' }}>
                    {feed.live.length} live room{feed.live.length === 1 ? '' : 's'}
                  </CustomText>
                </View>
                <CustomText variant="heading" style={{ color: '#F8F7FC', marginTop: 6 }} numberOfLines={2}>
                  {featuredVideo?.title ?? 'Featured video slot'}
                </CustomText>
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }} numberOfLines={2}>
                  {featuredVideo?.description ?? 'Latest videos and live replays will display here after content sync.'}
                </CustomText>
                <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                  <InlinePillButton icon="play-arrow" label="Watch" onPress={() => (featuredVideo ? openVideo(featuredVideo, 'videos_featured') : router.push('/(tabs)/PlaySection'))} />
                  <InlinePillButton
                    icon="notifications-active"
                    label="Notify"
                    onPress={async () => {
                      if (!featuredVideo) return;
                      await subscribeToLiveAlerts(featuredVideo.id);
                    }}
                  />
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={130}>
            <View
              style={{
                marginTop: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(216,194,255,0.12)',
                backgroundColor: 'rgba(154,107,255,0.06)',
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(154,107,255,0.16)', marginRight: 10 }}>
                <MaterialIcons name="campaign" size={20} color="#E8D7FF" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="label" style={{ color: '#F8F7FC' }}>
                  Ad placement section
                </CustomText>
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 3 }}>
                  Sponsored video campaigns can render between rows without breaking the content layout.
                </CustomText>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={180}>
            <View style={{ marginTop: 18 }}>
              <CustomText variant="heading" style={{ color: '#F8F7FC' }}>
                Video Feed
              </CustomText>
              <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 3 }}>
                Responsive grid for phone and tablet. Replays and YouTube uploads will populate here.
              </CustomText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 10 }}>
                {videos.length ? (
                  videos.map((item) => (
                    <View key={item.id} style={{ width: `${100 / columns}%`, paddingHorizontal: 6, marginBottom: 12 }}>
                      <VideoTile item={item} onPress={() => openVideo(item)} />
                    </View>
                  ))
                ) : (
                  <View style={{ width: '100%' }}>
                    <EmptyVideosState />
                  </View>
                )}
              </View>
            </View>
          </FadeIn>

          {error ? (
            <View style={{ marginTop: 6 }}>
              <CustomText variant="caption" style={{ color: theme.colors.danger }}>
                Feed error: {error}
              </CustomText>
            </View>
          ) : null}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function VideoTile({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(12,9,20,0.86)',
      }}
      showFocusBorder={false}
    >
      <View style={{ aspectRatio: 16 / 10 }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,4,13,0.86)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {item.isLive ? (
          <View style={{ position: 'absolute', top: 8, left: 8, borderRadius: 999, backgroundColor: 'rgba(127,29,29,0.78)', paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 5 }} />
            <CustomText variant="caption" style={{ color: '#FEE2E2' }}>
              LIVE
            </CustomText>
          </View>
        ) : null}
        <View style={{ position: 'absolute', bottom: 8, right: 8, borderRadius: 999, backgroundColor: 'rgba(10,8,17,0.76)', paddingHorizontal: 8, paddingVertical: 4 }}>
          <CustomText variant="caption" style={{ color: '#F8F7FC' }}>
            {item.duration || '--:--'}
          </CustomText>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <CustomText variant="label" style={{ color: '#F8F7FC' }} numberOfLines={2}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 3 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
        {item.liveViewerCount ? (
          <CustomText variant="caption" style={{ color: '#FCA5A5', marginTop: 4 }}>
            {item.liveViewerCount} watching
          </CustomText>
        ) : null}
      </View>
    </TVTouchable>
  );
}

function InlinePillButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={16} color="#EFE7FF" />
      <CustomText variant="caption" style={{ color: '#EFE7FF', marginLeft: 5 }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

function EmptyVideosState() {
  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(12,9,20,0.76)',
        padding: 14,
      }}
    >
      <CustomText variant="label" style={{ color: '#F8F7FC' }}>
        No video content synced yet
      </CustomText>
      <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }}>
        Once your YouTube sync or admin publishing flow runs, videos and live replays will render here automatically.
      </CustomText>
    </View>
  );
}
