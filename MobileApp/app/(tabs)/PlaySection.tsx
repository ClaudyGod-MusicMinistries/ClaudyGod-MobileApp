// app/(tabs)/PlaySection.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Screen } from '../../components/layout/Screen';
import { AudioPlayer } from '../../components/media/AudioPlayer';
import { AppButton } from '../../components/ui/AppButton';

const demoTrack = {
  title: 'Amazing Grace',
  artist: 'ClaudyGod',
  album: 'Worship Collection',
  imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
};

export default function PlaySection() {
  const theme = useAppTheme();

  return (
    <TabScreenWrapper>
      <View style={{ flex: 1, paddingTop: theme.spacing.lg, paddingBottom: 140 }}>
        <Screen>
          <View style={{ alignItems: 'center' }}>
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

        {/* Playback controls */}
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
          <View style={{ flexDirection: 'row', marginTop: theme.spacing.md }}>
            <AppButton title="Add to playlist" variant="outline" size="sm" style={{ marginRight: 8 }} />
            <AppButton title="Share" variant="ghost" size="sm" />
          </View>
        </View>
        </Screen>
      </View>
    </TabScreenWrapper>
  );
}
