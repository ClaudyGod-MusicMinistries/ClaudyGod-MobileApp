// app/(tabs)/home.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { HeroBanner } from '../../components/sections/HeroBanner';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { CustomText } from '../../components/CustomText';
import { featuredPlaylists, recentSongs } from '../../data/data';
import { MaterialIcons } from '@expo/vector-icons';
import { FadeIn } from '../../components/ui/FadeIn';
import { Screen } from '../../components/layout/Screen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { useRouter } from 'expo-router';

const trendingVideos = [
  {
    id: 'v1',
    title: 'Sunday Worship Live',
    subtitle: '2.1M views • 2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'v2',
    title: 'Night of Praise',
    subtitle: '540K views • 1 week ago',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'v3',
    title: 'Prayer & Healing',
    subtitle: '320K views • 2 weeks ago',
    imageUrl: 'https://images.unsplash.com/photo-1501281667305-0d4ebdb2c8e6?auto=format&fit=crop&w=800&q=80',
  },
];

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const actionCardWidth = isCompact ? '100%' : '48%';
  const quickActions = [
    { icon: 'library-music', label: 'My Library', subtitle: 'Saved songs and playlists', route: '/(tabs)/Favourites' },
    { icon: 'offline-pin', label: 'Downloads', subtitle: 'Listen offline anywhere', route: '/(tabs)/Favourites' },
    { icon: 'notifications-active', label: 'Alerts', subtitle: 'Live session reminders', route: '/(tabs)/Settings' },
    { icon: 'live-tv', label: 'Live', subtitle: 'Watch active broadcasts', route: '/(tabs)/PlaySection' },
  ];

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <FadeIn>
            <SurfaceCard
              tone="subtle"
              style={{
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.lg,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    Welcome back
                  </CustomText>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 4 }}>
                    ClaudyGod Studio
                  </CustomText>
                </View>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radius.md,
                    backgroundColor: `${theme.colors.primary}16`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="equalizer" size={20} color={theme.colors.primary} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                {[
                  { label: 'Active users', value: '82.4K' },
                  { label: 'Live now', value: '03' },
                  { label: 'Playlists', value: '146' },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={{
                      flex: 1,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      padding: theme.spacing.sm,
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
            </SurfaceCard>
          </FadeIn>

          <FadeIn>
            <HeroBanner
              imageUrl="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80"
              title="Worship Essentials"
              subtitle="Stream the latest live sessions and exclusive audio drops."
              onPlay={() => console.log('Play hero')}
              onSave={() => console.log('Save hero')}
            />
          </FadeIn>

          <FadeIn delay={120} style={{ marginBottom: theme.spacing.lg }}>
            <CustomText variant="title" style={{ color: theme.colors.text.primary }}>
              Continue Watching
            </CustomText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing.sm }}>
              {trendingVideos.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    width: 260,
                    marginRight: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  onPress={() => console.log(item.title)}
                >
                  <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                  <View
                    style={{
                      position: 'absolute',
                      right: theme.spacing.sm,
                      top: theme.spacing.sm,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ padding: theme.spacing.sm }}>
                    <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                      {item.title}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                      {item.subtitle}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </FadeIn>

          <FadeIn delay={200}>
            <MediaRail
              title="Trending Playlists"
              actionLabel="See all"
              onAction={() => console.log('See all trending')}
              data={featuredPlaylists}
              renderItem={(playlist) => (
                <PosterCard
                  key={playlist.id}
                  imageUrl={playlist.imageUrl}
                  title={playlist.title}
                  subtitle={`${playlist.songCount} songs`}
                  onPress={() => console.log('Open playlist', playlist.id)}
                  size="md"
                />
              )}
            />
          </FadeIn>

          <FadeIn delay={260}>
            <MediaRail
              title="New Releases"
              actionLabel="More"
              onAction={() => console.log('See all new')}
              data={recentSongs}
              renderItem={(song) => (
                <PosterCard
                  key={song.id}
                  imageUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80"
                  title={song.title}
                  subtitle={song.artist}
                  onPress={() => console.log('Play song', song.id)}
                  size="sm"
                />
              )}
            />
          </FadeIn>

          <FadeIn delay={320}>
            <SurfaceCard
              style={{
                padding: theme.spacing.lg,
                marginTop: theme.spacing.md,
              }}
            >
              <CustomText variant="title" style={{ color: theme.colors.text.primary }}>
                Quick actions
              </CustomText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.label}
                  style={{
                    width: actionCardWidth,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceAlt,
                      padding: theme.spacing.md,
                    }}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: `${theme.colors.primary}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <MaterialIcons name={action.icon as any} size={18} color={theme.colors.primary} />
                    </View>
                    <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                      {action.label}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                      {action.subtitle}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </SurfaceCard>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
