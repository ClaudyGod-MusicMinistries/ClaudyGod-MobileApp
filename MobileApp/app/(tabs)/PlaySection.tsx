// app/(tabs)/PlaySection.tsx
import React from 'react';
import { View, Image, useWindowDimensions } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Screen } from '../../components/layout/Screen';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';

const demoTrack = {
  title: 'Amazing Grace',
  artist: 'ClaudyGod',
  album: 'Worship Collection',
  imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

export default function PlaySection() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <TabScreenWrapper>
      <View style={{ flex: 1, paddingTop: theme.spacing.lg, paddingBottom: 140 }}>
        <Screen>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    Now Playing
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                    Seamless audio and video playback with TV-ready controls.
                  </CustomText>
                </View>
              </View>

              <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
                <Image
                  source={{ uri: demoTrack.imageUrl }}
                  style={{
                    width: '100%',
                    height: 260,
                    borderRadius: theme.radius.lg,
                    backgroundColor: theme.colors.surface,
                  }}
                  resizeMode="cover"
                />
                <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    {demoTrack.title}
                  </CustomText>
                  <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                    {demoTrack.artist} • {demoTrack.album}
                  </CustomText>
                </View>
              </View>
            </SurfaceCard>
          </FadeIn>

          <FadeIn delay={80}>
            <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {[
                { label: 'Queue', value: '12 tracks' },
                { label: 'Quality', value: 'High' },
                { label: 'Output', value: 'Stereo' },
              ].map((stat) => (
                <SurfaceCard
                  key={stat.label}
                  style={{ width: isCompact ? '100%' : '31.5%', padding: theme.spacing.sm }}
                >
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {stat.label}
                  </CustomText>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginTop: 2 }}>
                    {stat.value}
                  </CustomText>
                </SurfaceCard>
              ))}
            </View>
          </FadeIn>

          {/* Playback controls */}
          <FadeIn delay={150}>
            <View style={{ marginTop: theme.spacing.lg }}>
              <AudioPlayer
                track={{
                  id: 'demo-track',
                  title: demoTrack.title,
                  artist: demoTrack.artist,
                  uri: demoTrack.mediaUrl,
                  duration: '4:32',
                }}
                compact
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
                <AppButton title="Add to playlist" variant="outline" size="sm" style={{ minWidth: 160 }} />
                <AppButton title="Share" variant="ghost" size="sm" style={{ minWidth: 120 }} />
              </View>
            </View>
          </FadeIn>
        </Screen>
      </View>
    </TabScreenWrapper>
  );
}
