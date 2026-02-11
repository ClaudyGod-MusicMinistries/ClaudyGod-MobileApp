// app/(tabs)/PlaySection.tsx
import React, { useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Screen } from '../../components/layout/Screen';

const demoTrack = {
  title: 'Amazing Grace',
  artist: 'ClaudyGod',
  album: 'Worship Collection',
  imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
};

export default function PlaySection() {
  const theme = useAppTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);

  return (
    <TabScreenWrapper>
      <View style={{ flex: 1, paddingTop: theme.spacing.lg, paddingBottom: 140 }}>
        <Screen>
          <View style={{ alignItems: 'center' }}>
          <Image
            source={{ uri: demoTrack.imageUrl }}
            style={{
              width: '100%',
              height: 320,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
            }}
            resizeMode="cover"
          />
          <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
            <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 24 }}>
              {demoTrack.title}
            </CustomText>
            <CustomText style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
              {demoTrack.artist} • {demoTrack.album}
            </CustomText>
          </View>
        </View>

        {/* Playback controls */}
        <View style={{ marginTop: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setLiked(!liked)}>
              <MaterialIcons
                name={liked ? 'favorite' : 'favorite-border'}
                size={26}
                color={liked ? theme.colors.secondary : theme.colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="playlist-add" size={26} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="more-vert" size={26} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: theme.spacing.lg }}>
            <View
              style={{
                height: 4,
                borderRadius: 999,
                backgroundColor: theme.colors.muted,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: '45%', height: 4, backgroundColor: theme.colors.primary }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <CustomText style={{ color: theme.colors.text.secondary, fontSize: 12 }}>1:48</CustomText>
              <CustomText style={{ color: theme.colors.text.secondary, fontSize: 12 }}>4:32</CustomText>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: theme.spacing.lg,
            }}
          >
            <TouchableOpacity>
              <MaterialIcons name="repeat" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="skip-previous" size={36} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={36}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="skip-next" size={36} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MaterialIcons name="shuffle" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          </View>
        </Screen>
      </View>
    </TabScreenWrapper>
  );
}
