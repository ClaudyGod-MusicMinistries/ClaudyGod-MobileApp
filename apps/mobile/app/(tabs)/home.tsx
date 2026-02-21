import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useContentFeed } from '../../hooks/useContentFeed';
import { pushNotificationService } from '../../services/pushNotificationService';
import { subscribeToLiveAlerts, trackPlayEvent } from '../../services/supabaseAnalytics';
import type { FeedCardItem } from '../../services/contentService';

const ALL_FILTER = 'All';

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;

  const { feed, loading, error, refresh } = useContentFeed();
  const [activeCategory, setActiveCategory] = useState<string>(ALL_FILTER);

  const itemCardWidth = isTV ? 280 : isTablet ? 220 : 162;
  const adCardWidth = isTV ? 360 : isTablet ? 280 : 230;
  const heroHeight = isTV ? 370 : isTablet ? 320 : 272;

  const filteredFeed = useMemo(() => {
    if (activeCategory === ALL_FILTER) {
      return feed;
    }

    switch (activeCategory.toLowerCase()) {
      case 'music':
        return { ...feed, videos: [], playlists: [], live: [], ads: [] };
      case 'videos':
        return { ...feed, music: [], playlists: [], live: [], ads: [] };
      case 'live':
        return { ...feed, music: [], videos: [], playlists: [], ads: [] };
      case 'playlists':
        return { ...feed, music: [], videos: [], live: [], ads: [] };
      case 'ads':
        return { ...feed, music: [], videos: [], live: [], playlists: [] };
      default:
        return feed;
    }
  }, [activeCategory, feed]);

  const featured = filteredFeed.featured;
  const pinnedPlayer = filteredFeed.mostPlayed[0] ?? filteredFeed.music[0] ?? filteredFeed.videos[0] ?? null;

  const openPlayer = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push('/(tabs)/PlaySection');
  };

  const onLiveNotify = async (item: FeedCardItem) => {
    await subscribeToLiveAlerts(item.id);
    await pushNotificationService.initialize();
    await pushNotificationService.scheduleLocalNotification(
      'Live alert enabled',
      `${item.title} will notify you when the channel goes live.`,
      { channelId: item.id },
    );
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 190 }}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <Image
                  source={require('../../assets/images/ClaudyGoLogo.webp')}
                  style={{ width: 42, height: 42, borderRadius: 12 }}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    ClaudyGod Streaming Suite
                  </CustomText>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                    Music, Videos, Live, Ads
                  </CustomText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <CircleIcon icon="search" onPress={() => router.push('/(tabs)/search')} />
                <CircleIcon icon="person-outline" onPress={() => router.push('/profile')} />
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={30}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              overScrollMode="never"
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 2, paddingRight: 6 }}
            >
              {feed.topCategories.map((category) => {
                const active = activeCategory === category;
                return (
                  <TVTouchable
                    key={category}
                    onPress={() => setActiveCategory(category)}
                    style={{
                      marginRight: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? 'rgba(154,107,255,0.56)' : theme.colors.border,
                      backgroundColor: active ? 'rgba(154,107,255,0.17)' : theme.colors.surface,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: active ? theme.colors.primary : theme.colors.text.primary }}>
                      {category}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </ScrollView>
          </FadeIn>

          {loading ? (
            <View
              style={{
                marginTop: 20,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: 22,
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
              }}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <CustomText variant="caption" style={{ marginTop: 8, color: theme.colors.text.secondary }}>
                Loading channel content...
              </CustomText>
            </View>
          ) : null}

          {error ? (
            <View
              style={{
                marginTop: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(248,113,113,0.38)',
                backgroundColor: 'rgba(126,34,34,0.18)',
                padding: 12,
              }}
            >
              <CustomText variant="caption" style={{ color: '#fecaca' }}>
                Feed sync issue: {error}
              </CustomText>
              <TVTouchable onPress={refresh} showFocusBorder={false} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                <CustomText variant="label" style={{ color: '#fda4af' }}>
                  Retry
                </CustomText>
              </TVTouchable>
            </View>
          ) : null}

          {featured ? (
            <FadeIn delay={60}>
              <TVTouchable
                onPress={() => openPlayer(featured, 'home_featured')}
                style={{
                  marginTop: 14,
                  height: heroHeight,
                  borderRadius: 26,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: '#0E081A',
                }}
                showFocusBorder={false}
              >
                <Image source={{ uri: featured.imageUrl }} style={{ width: '100%', height: heroHeight + 20 }} />

                <LinearGradient
                  colors={['rgba(5,4,9,0.08)', 'rgba(5,4,9,0.65)', 'rgba(5,4,9,0.95)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 }}
                />

                <View style={{ position: 'absolute', left: 16, right: 16, top: 14 }}>
                  <CustomText variant="label" style={{ color: '#DCCAFF' }}>
                    Featured Channel Drop
                  </CustomText>
                  <CustomText
                    variant="display"
                    style={{
                      marginTop: 4,
                      color: '#F8F7FC',
                      fontSize: isTV ? 34 : isTablet ? 29 : 23,
                      lineHeight: isTV ? 40 : isTablet ? 34 : 28,
                    }}
                  >
                    {featured.title}
                  </CustomText>
                  <CustomText variant="body" style={{ color: 'rgba(231,223,249,0.92)', marginTop: 6 }} numberOfLines={2}>
                    {featured.description}
                  </CustomText>
                </View>

                <View
                  style={{
                    position: 'absolute',
                    right: 14,
                    bottom: 16,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#9A6BFF',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.45)',
                  }}
                >
                  <MaterialIcons name="play-arrow" size={28} color="#FFFFFF" />
                </View>
              </TVTouchable>
            </FadeIn>
          ) : null}

          <FadeIn delay={90}>
            <SectionHeader title="Live Now" actionLabel="See all" onPress={() => router.push('/(tabs)/videos')} />
            {filteredFeed.live.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                {filteredFeed.live.map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => openPlayer(item, 'home_live')}
                    style={{
                      width: itemCardWidth,
                      marginRight: 10,
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(248,113,113,0.46)',
                      backgroundColor: theme.colors.surface,
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 110 }} />
                    <View style={{ padding: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                        <CustomText variant="caption" style={{ color: '#ef9a9a' }}>
                          LIVE • {item.liveViewerCount ?? 0} watching
                        </CustomText>
                      </View>
                      <CustomText variant="body" style={{ color: theme.colors.text.primary, marginTop: 6 }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <TVTouchable onPress={() => onLiveNotify(item)} showFocusBorder={false} style={{ marginTop: 6 }}>
                        <CustomText variant="label" style={{ color: theme.colors.primary }}>
                          Notify me
                        </CustomText>
                      </TVTouchable>
                    </View>
                  </TVTouchable>
                ))}
              </ScrollView>
            ) : (
              <EmptyHint text="No live channels yet. When your client goes live, it will appear here." />
            )}
          </FadeIn>

          <FadeIn delay={120}>
            <SectionHeader title="Sponsored Ads" actionLabel="Manage" onPress={() => router.push('/(tabs)/videos')} />
            {filteredFeed.ads.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                {filteredFeed.ads.map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => openPlayer(item, 'home_ads')}
                    style={{
                      width: adCardWidth,
                      marginRight: 12,
                      borderRadius: 18,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 128 }} />
                    <View style={{ padding: 10 }}>
                      <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                        Sponsored
                      </CustomText>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginTop: 4 }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
                        {item.description}
                      </CustomText>
                    </View>
                  </TVTouchable>
                ))}
              </ScrollView>
            ) : (
              <EmptyHint text="No ad slots published yet." />
            )}
          </FadeIn>

          <FadeIn delay={140}>
            <SectionHeader title="Music" actionLabel="Open" onPress={() => router.push('/(tabs)/library')} />
            {filteredFeed.music.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                {filteredFeed.music.map((item) => (
                  <MediaTile key={item.id} item={item} width={itemCardWidth} onPress={() => openPlayer(item, 'home_music')} />
                ))}
              </ScrollView>
            ) : (
              <EmptyHint text="No music uploaded yet." />
            )}
          </FadeIn>

          <FadeIn delay={160}>
            <SectionHeader title="Videos" actionLabel="Open" onPress={() => router.push('/(tabs)/videos')} />
            {filteredFeed.videos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never">
                {filteredFeed.videos.map((item) => (
                  <MediaTile key={item.id} item={item} width={itemCardWidth} onPress={() => openPlayer(item, 'home_videos')} />
                ))}
              </ScrollView>
            ) : (
              <EmptyHint text="No videos uploaded yet." />
            )}
          </FadeIn>

          <FadeIn delay={180}>
            <SectionHeader title="Playlists" actionLabel="Open" onPress={() => router.push('/(tabs)/library')} />
            {filteredFeed.playlists.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
                {filteredFeed.playlists.slice(0, isTV ? 8 : 6).map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => openPlayer(item, 'home_playlists')}
                    style={{
                      width: isTV ? '24%' : isTablet ? '32%' : '48.5%',
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 104 }} />
                    <View style={{ padding: 10 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
                        {item.subtitle}
                      </CustomText>
                    </View>
                  </TVTouchable>
                ))}
              </View>
            ) : (
              <EmptyHint text="No playlists created yet." />
            )}
          </FadeIn>

          <FadeIn delay={210}>
            <SectionHeader title="Recently Added" actionLabel="Refresh" onPress={refresh} />
            {filteredFeed.recent.length > 0 ? (
              <View style={{ gap: 8 }}>
                {filteredFeed.recent.slice(0, 8).map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => openPlayer(item, 'home_recent')}
                    style={{
                      minHeight: 64,
                      borderRadius: 16,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
                        {item.subtitle}
                      </CustomText>
                    </View>
                    <MaterialIcons name="play-circle-outline" size={22} color={theme.colors.primary} />
                  </TVTouchable>
                ))}
              </View>
            ) : (
              <EmptyHint text="No recent uploads yet." />
            )}
          </FadeIn>
        </Screen>
      </ScrollView>

      {pinnedPlayer ? (
        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: isTV ? 142 : isTablet ? 118 : 102,
          }}
        >
          <TVTouchable
            onPress={() => openPlayer(pinnedPlayer, 'home_miniplayer')}
            style={{
              borderRadius: 20,
              padding: 10,
              borderWidth: 1,
              borderColor: 'rgba(227,218,246,0.2)',
              backgroundColor: 'rgba(17,13,29,0.90)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            showFocusBorder={false}
          >
            <Image source={{ uri: pinnedPlayer.imageUrl }} style={{ width: 46, height: 46, borderRadius: 13, marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <CustomText variant="subtitle" style={{ color: '#F8F7FC' }} numberOfLines={1}>
                {pinnedPlayer.title}
              </CustomText>
              <CustomText variant="caption" style={{ color: '#BFB5DA', marginTop: 2 }} numberOfLines={1}>
                {pinnedPlayer.subtitle}
              </CustomText>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.primary,
              }}
            >
              <MaterialIcons name="play-arrow" size={20} color={theme.colors.text.inverse} />
            </View>
          </TVTouchable>
        </View>
      ) : null}
    </TabScreenWrapper>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onPress,
}: {
  title: string;
  actionLabel: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        marginTop: 18,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <CustomText variant="label" style={{ color: theme.colors.primary }}>
          {actionLabel}
        </CustomText>
      </TVTouchable>
    </View>
  );
}

function CircleIcon({ icon, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={18} color={theme.colors.text.primary} />
    </TVTouchable>
  );
}

function MediaTile({ item, width, onPress }: { item: FeedCardItem; width: number; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width,
        marginRight: 12,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 120 }} />
      <View style={{ padding: 10 }}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
          {item.subtitle}
        </CustomText>
      </View>
    </TVTouchable>
  );
}

function EmptyHint({ text }: { text: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.surface,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
        {text}
      </CustomText>
    </View>
  );
}
