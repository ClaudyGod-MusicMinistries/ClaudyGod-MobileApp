import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';

export default function PlaySection() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const { feed } = useContentFeed();

  const queue = useMemo(() => {
    const items = [...feed.music, ...feed.videos, ...feed.playlists].slice(0, 12);
    return items;
  }, [feed.music, feed.playlists, feed.videos]);

  const [activeId, setActiveId] = useState<string | null>(queue[0]?.id ?? null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPlaying) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPlaying, pulse]);

  useEffect(() => {
    if (!queue.length) return;
    if (!activeId || !queue.some((item) => item.id === activeId)) {
      setActiveId(queue[0].id);
    }
  }, [activeId, queue]);

  const active = queue.find((item) => item.id === activeId) ?? null;
  const progress = 0.42;

  const chooseTrack = async (item: FeedCardItem) => {
    setActiveId(item.id);
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: 'player_queue' });
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 26,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(12,9,20,0.88)',
                padding: compact ? 14 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TVTouchable
                  onPress={() => undefined}
                  style={iconButtonStyle}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#F8F7FC" />
                </TVTouchable>
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                  Now Playing
                </CustomText>
                <TVTouchable
                  onPress={() => undefined}
                  style={iconButtonStyle}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="more-horiz" size={20} color="#F8F7FC" />
                </TVTouchable>
              </View>

              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <Animated.View style={{ transform: [{ scale: pulse }] }}>
                  <Image
                    source={{ uri: active?.imageUrl ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80' }}
                    style={{ width: compact ? 216 : 248, height: compact ? 216 : 248, borderRadius: 28 }}
                    resizeMode="cover"
                  />
                </Animated.View>

                <CustomText variant="heading" style={{ color: '#F8F7FC', marginTop: 14 }} numberOfLines={1}>
                  {active?.title ?? 'No track loaded'}
                </CustomText>
                <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 3 }} numberOfLines={1}>
                  {active?.subtitle ?? 'Connect content feed to queue tracks'}
                </CustomText>

                <View style={{ width: '100%', marginTop: 16 }}>
                  <View style={{ height: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                    <View style={{ width: `${Math.round(progress * 100)}%`, height: 2, borderRadius: 999, backgroundColor: theme.colors.primary }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <CustomText variant="caption" style={{ color: 'rgba(171,162,198,0.9)' }}>
                      1:24
                    </CustomText>
                    <CustomText variant="caption" style={{ color: 'rgba(171,162,198,0.9)' }}>
                      {active?.duration || '--:--'}
                    </CustomText>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: compact ? 10 : 14, marginTop: 14 }}>
                  <Control icon="shuffle" onPress={() => undefined} />
                  <Control icon="skip-previous" onPress={() => undefined} />
                  <TVTouchable
                    onPress={() => setIsPlaying((v) => !v)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.primary,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.22)',
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={30} color="#FFFFFF" />
                  </TVTouchable>
                  <Control icon="skip-next" onPress={() => undefined} />
                  <Control icon="repeat" onPress={() => undefined} />
                </View>

                <TVTouchable
                  onPress={() => setShowLyrics((v) => !v)}
                  style={{
                    marginTop: 14,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name={showLyrics ? 'lyrics' : 'subtitles'} size={16} color="#EFE7FF" />
                  <CustomText variant="caption" style={{ color: '#EFE7FF', marginLeft: 6 }}>
                    {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
                  </CustomText>
                </TVTouchable>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={110}>
            <View
              style={{
                marginTop: 14,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(12,9,20,0.86)',
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                    {showLyrics ? 'LYRICS PANEL' : 'UP NEXT'}
                  </CustomText>
                  <CustomText variant="heading" style={{ color: '#F8F7FC', marginTop: 3 }}>
                    {showLyrics ? 'Worship Lyrics Preview' : 'Queue'}
                  </CustomText>
                </View>
                <TVTouchable onPress={() => setShowLyrics((v) => !v)} style={iconButtonStyle} showFocusBorder={false}>
                  <MaterialIcons name={showLyrics ? 'queue-music' : 'article'} size={20} color="#F8F7FC" />
                </TVTouchable>
              </View>

              {showLyrics ? (
                <View
                  style={{
                    marginTop: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.07)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <CustomText variant="body" style={{ color: '#F8F7FC' }}>
                    Placeholder lyrics panel for the active track.
                  </CustomText>
                  <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                    Connect lyrics provider or CMS field in your content pipeline to render synchronized lyrics here.
                  </CustomText>
                </View>
              ) : (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {queue.length ? (
                    queue.map((item) => {
                      const selected = item.id === activeId;
                      return (
                        <TVTouchable
                          key={item.id}
                          onPress={() => chooseTrack(item)}
                          style={{
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: selected ? 'rgba(154,107,255,0.18)' : 'rgba(255,255,255,0.06)',
                            backgroundColor: selected ? 'rgba(154,107,255,0.09)' : 'rgba(255,255,255,0.02)',
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          showFocusBorder={false}
                        >
                          <Image source={{ uri: item.imageUrl }} style={{ width: 42, height: 42, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
                          <View style={{ flex: 1 }}>
                            <CustomText variant="label" style={{ color: '#F8F7FC' }} numberOfLines={1}>
                              {item.title}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 2 }} numberOfLines={1}>
                              {item.subtitle}
                            </CustomText>
                          </View>
                          <CustomText variant="caption" style={{ color: selected ? '#E6DBFF' : 'rgba(171,162,198,0.9)' }}>
                            {item.duration || '--:--'}
                          </CustomText>
                        </TVTouchable>
                      );
                    })
                  ) : (
                    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12 }}>
                      <CustomText variant="label" style={{ color: '#F8F7FC' }}>
                        Queue empty
                      </CustomText>
                      <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)', marginTop: 4 }}>
                        Publish audio or video content and it will appear here as a queue.
                      </CustomText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function Control({ icon, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void }) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={19} color="#F8F7FC" />
    </TVTouchable>
  );
}

const iconButtonStyle = {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
} as const;
