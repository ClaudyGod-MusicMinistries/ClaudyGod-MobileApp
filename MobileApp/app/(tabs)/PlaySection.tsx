import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';

type QueueTrack = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  elapsed: string;
  progress: number;
  artwork: string;
};

const queue: QueueTrack[] = [
  {
    id: 'q1',
    title: 'The Dawn',
    artist: 'Oscar H.',
    duration: '3:02',
    elapsed: '0:56',
    progress: 0.31,
    artwork: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q2',
    title: 'Call my name',
    artist: 'Sami Yu.',
    duration: '3:02',
    elapsed: '0:41',
    progress: 0.22,
    artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q3',
    title: 'Attention',
    artist: 'Charlie',
    duration: '3:02',
    elapsed: '1:09',
    progress: 0.4,
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q4',
    title: 'See you again',
    artist: 'Wiz Khalifa',
    duration: '3:02',
    elapsed: '0:32',
    progress: 0.17,
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'q5',
    title: 'Girls like you',
    artist: 'Maroon 5',
    duration: '3:02',
    elapsed: '0:25',
    progress: 0.14,
    artwork: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=900&q=80',
  },
];

export default function PlaySection() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [activeId, setActiveId] = useState(queue[0].id);

  const active = useMemo(
    () => queue.find((track) => track.id === activeId) ?? queue[0],
    [activeId],
  );

  const ui = {
    panel: theme.scheme === 'dark' ? '#161621' : '#EFEFF2',
    card: theme.scheme === 'dark' ? '#1E1E2C' : '#FFFFFF',
    text: theme.scheme === 'dark' ? '#F4F4F7' : '#15161A',
    subText: theme.scheme === 'dark' ? '#A6A6B2' : '#8A8B92',
    black: '#111217',
    accent: '#3295FF',
  };

  return (
    <TabScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 180 }}>
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 28,
                backgroundColor: ui.card,
                padding: compact ? 16 : 18,
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? '#2A2A3D' : '#E3E3E8',
                alignItems: 'center',
              }}
            >
              <Image
                source={{ uri: active.artwork }}
                style={{
                  width: compact ? 232 : 260,
                  height: compact ? 232 : 260,
                  borderRadius: 130,
                  marginTop: compact ? 6 : 2,
                }}
                resizeMode="cover"
              />

              <View style={{ marginTop: 18, width: '100%' }}>
                <CustomText variant="heading" style={{ color: ui.text }}>
                  {active.title}
                </CustomText>
                <CustomText variant="subtitle" style={{ color: ui.subText, marginTop: 2 }}>
                  {active.artist}
                </CustomText>

                <View style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: theme.scheme === 'dark' ? '#26263A' : '#E9E9ED', paddingHorizontal: 12, paddingVertical: 6 }}>
                  <CustomText variant="label" style={{ color: ui.text }}>
                    Lyrics
                  </CustomText>
                </View>

                <View style={{ marginTop: 16 }}>
                  <View style={{ height: 4, borderRadius: 999, backgroundColor: theme.scheme === 'dark' ? '#2D2D42' : '#DADBE2' }}>
                    <View
                      style={{
                        width: `${Math.round(active.progress * 100)}%`,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: ui.accent,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <CustomText variant="caption" style={{ color: ui.subText }}>
                      {active.elapsed}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: ui.subText }}>
                      {active.duration}
                    </CustomText>
                  </View>
                </View>

                <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
                  <TVTouchable
                    onPress={() => console.log('prev')}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="skip-previous" size={24} color={ui.text} />
                  </TVTouchable>
                  <TVTouchable
                    onPress={() => console.log('play/pause')}
                    style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ui.black, alignItems: 'center', justifyContent: 'center' }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="play-arrow" size={32} color="#FFFFFF" />
                  </TVTouchable>
                  <TVTouchable
                    onPress={() => console.log('next')}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name="skip-next" size={24} color={ui.text} />
                  </TVTouchable>
                </View>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={100}>
            <View
              style={{
                marginTop: 14,
                borderRadius: 24,
                backgroundColor: ui.panel,
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? '#2A2A3D' : '#E3E3E8',
                overflow: 'hidden',
              }}
            >
              <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <CustomText variant="caption" style={{ color: ui.subText }}>
                    PLAYLIST
                  </CustomText>
                  <CustomText variant="heading" style={{ color: ui.text, marginTop: 2 }}>
                    Playlist name
                  </CustomText>
                </View>
                <TVTouchable
                  onPress={() => console.log('playlist menu')}
                  style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.card }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={ui.subText} />
                </TVTouchable>
              </View>

              {queue.map((track, index) => {
                const selected = track.id === activeId;
                return (
                  <TVTouchable
                    key={track.id}
                    onPress={() => setActiveId(track.id)}
                    hasTVPreferredFocus={index === 0}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderTopColor: theme.scheme === 'dark' ? '#2C2C40' : '#E1E1E7',
                      backgroundColor: selected ? (theme.scheme === 'dark' ? '#242438' : '#F3F7FF') : 'transparent',
                    }}
                    showFocusBorder={false}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: theme.scheme === 'dark' ? '#41415C' : '#CED0D9',
                          marginRight: 10,
                          backgroundColor: selected ? `${ui.accent}24` : ui.card,
                        }}
                      >
                        <MaterialIcons
                          name={selected ? 'pause' : 'play-arrow'}
                          size={18}
                          color={selected ? ui.accent : ui.subText}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText variant="caption" style={{ color: ui.subText, textTransform: 'uppercase' }} numberOfLines={1}>
                          {track.artist}
                        </CustomText>
                        <CustomText variant="subtitle" style={{ color: ui.text, marginTop: 2 }} numberOfLines={1}>
                          {track.title}
                        </CustomText>
                        {selected ? (
                          <View style={{ height: 3, borderRadius: 999, backgroundColor: '#D8E9FF', marginTop: 8 }}>
                            <View style={{ width: `${Math.round(track.progress * 100)}%`, height: 3, borderRadius: 999, backgroundColor: ui.accent }} />
                          </View>
                        ) : null}
                      </View>
                      <CustomText variant="caption" style={{ color: ui.subText, marginLeft: 8 }}>
                        {track.duration}
                      </CustomText>
                    </View>
                  </TVTouchable>
                );
              })}
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 86 }}>
        <View
          style={{
            borderRadius: 18,
            backgroundColor: ui.accent,
            paddingVertical: 12,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' }}>
            <MaterialIcons name="pause" size={16} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {active.artist}
            </CustomText>
            <CustomText variant="subtitle" style={{ color: '#FFFFFF', marginTop: 1 }} numberOfLines={1}>
              {active.title}
            </CustomText>
          </View>
          <MaterialIcons name="keyboard-arrow-up" size={20} color="#FFFFFF" />
        </View>
      </View>
    </TabScreenWrapper>
  );
}
