// app/(tabs)/home.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { HeroBanner } from '../../components/sections/HeroBanner';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { CustomText } from '../../components/CustomText';
import { featuredPlaylists, recentSongs } from '../../data/data';
import { MaterialIcons } from '@expo/vector-icons';
import { FadeIn } from '../../components/ui/FadeIn';

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

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <FadeIn>
            <HeroBanner
              imageUrl="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80"
              title="Worship Essentials"
              subtitle="Stream the latest live sessions and exclusive audio drops."
              onPlay={() => console.log('Play hero')}
              onSave={() => console.log('Save hero')}
            />
          </FadeIn>

          {/* Continue Watching */}
          <FadeIn delay={120} style={{ marginBottom: theme.spacing.lg }}>
            <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: theme.typography.title }}>
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
                  <View style={{ padding: theme.spacing.sm }}>
                    <CustomText className="font-semibold" style={{ color: theme.colors.text.primary }}>
                      {item.title}
                    </CustomText>
                    <CustomText style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                      {item.subtitle}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </FadeIn>

          {/* Trending Playlists */}
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

          {/* New Releases */}
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

          {/* Quick Actions */}
          <FadeIn delay={320}>
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginTop: theme.spacing.md,
              }}
            >
            <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: theme.typography.title }}>
              Quick actions
            </CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
              {[
                { icon: 'library-music', label: 'My Library' },
                { icon: 'offline-pin', label: 'Downloads' },
                { icon: 'notifications-active', label: 'Alerts' },
                { icon: 'live-tv', label: 'Live' },
              ].map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    backgroundColor: `${theme.colors.primary}18`,
                    borderWidth: 1,
                    borderColor: `${theme.colors.primary}40`,
                  }}
                  onPress={() => console.log(action.label)}
                >
                  <MaterialIcons name={action.icon as any} size={18} color={theme.colors.primary} />
                  <CustomText style={{ color: theme.colors.text.primary, marginLeft: 8 }}>{action.label}</CustomText>
                </TouchableOpacity>
              ))}
            </View>
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </TabScreenWrapper>
  );
}
