import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AudioPlayer, AudioTrack } from '../../components/media/AudioPlayer';

const queue: (AudioTrack & { artwork: string })[] = [
  {
    id: 'q1',
    title: 'The Dawn',
    artist: 'Oscar H.',
    duration: '3:02',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q2',
    title: 'Call my name',
    artist: 'Sami Yu.',
    duration: '3:02',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q3',
    title: 'Attention',
    artist: 'Charlie',
    duration: '3:02',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q4',
    title: 'See you again',
    artist: 'Wiz Khalifa',
    duration: '3:02',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q5',
    title: 'Girls like you',
    artist: 'Maroon 5',
    duration: '3:02',
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    artwork: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=900&q=80',
  },
];

export default function PlaySection() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [activeTrackId, setActiveTrackId] = useState(queue[0].id);

  const activeTrack = useMemo(
    () => queue.find((track) => track.id === activeTrackId) ?? queue[0],
    [activeTrackId],
  );

  return (
    <TabScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 150 }}>
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 28,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: activeTrack.artwork }}
                style={{
                  width: '100%',
                  height: compact ? 260 : 320,
                  borderBottomLeftRadius: 28,
                  borderBottomRightRadius: 28,
                }}
                resizeMode="cover"
              />

              <View style={{ padding: theme.spacing.lg }}>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, letterSpacing: 1.2 }}>
                  PLAYLIST
                </CustomText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                    {activeTrack.title}
                  </CustomText>
                  <TVTouchable
                    onPress={() => console.log('Playlist options')}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.surfaceAlt,
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="keyboard-arrow-down" size={18} color={theme.colors.text.secondary} />
                  </TVTouchable>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing.lg }}>
                  <TVTouchable
                    onPress={() => console.log('previous')}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceAlt,
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="skip-previous" size={22} color={theme.colors.text.primary} />
                  </TVTouchable>

                  <TVTouchable
                    onPress={() => console.log('pause')}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.primary,
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="pause" size={30} color={theme.colors.text.inverse} />
                  </TVTouchable>

                  <TVTouchable
                    onPress={() => console.log('next')}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceAlt,
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="skip-next" size={22} color={theme.colors.text.primary} />
                  </TVTouchable>
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={100}>
            <View style={{ marginTop: theme.spacing.lg }}>
              <AudioPlayer track={activeTrack} compact />
            </View>
          </FadeIn>

          <FadeIn delay={170}>
            <View style={{ marginTop: theme.spacing.lg }}>
              <CustomText variant="title" style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
                Up Next
              </CustomText>
              <View
                style={{
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  overflow: 'hidden',
                }}
              >
                {queue.map((track, index) => {
                  const active = track.id === activeTrackId;
                  return (
                    <TVTouchable
                      key={track.id}
                      onPress={() => setActiveTrackId(track.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: 11,
                        borderBottomWidth: index === queue.length - 1 ? 0 : 1,
                        borderBottomColor: theme.colors.border,
                        backgroundColor: active ? `${theme.colors.primary}16` : 'transparent',
                      }}
                      showFocusBorder={false}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                          backgroundColor: active ? `${theme.colors.primary}26` : theme.colors.surfaceAlt,
                        }}
                      >
                        <MaterialIcons
                          name={active ? 'pause' : 'play-arrow'}
                          size={18}
                          color={active ? theme.colors.primary : theme.colors.text.secondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, textTransform: 'uppercase' }} numberOfLines={1}>
                          {track.artist}
                        </CustomText>
                        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginTop: 2 }} numberOfLines={1}>
                          {track.title}
                        </CustomText>
                      </View>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                        {track.duration}
                      </CustomText>
                    </TVTouchable>
                  );
                })}
              </View>
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
