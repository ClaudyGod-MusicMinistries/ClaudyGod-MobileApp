// app/(tabs)/Favourites.tsx
import React, { useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Chip } from '../../components/ui/Chip';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { favouritePlaylists, favouriteSongs, featuredVideos } from '../../data/data';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '../../components/layout/Screen';
import { SongList, Song } from '../../components/musicPlaylist';
import { AppButton } from '../../components/ui/AppButton';
import * as DocumentPicker from 'expo-document-picker';
import { AudioPlayer, AudioTrack } from '../../components/media/AudioPlayer';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';

export default function Favourites() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const actionWidth = isCompact ? '100%' : '48%';
  const [tab, setTab] = useState<'library' | 'local' | 'videos' | 'downloads'>('library');
  const [activeTrack, setActiveTrack] = useState<AudioTrack | null>(null);
  const [localTracks, setLocalTracks] = useState<AudioTrack[]>([]);
  const [videoItems, setVideoItems] = useState(featuredVideos);
  const [activeVideo, setActiveVideo] = useState(featuredVideos[0]);

  const allSongs: Song[] = useMemo(
    () =>
      favouriteSongs.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        mediaUrl: song.mediaUrl,
      })),
    [],
  );

  const onLibrarySongPress = (song: Song) => {
    if (!song.mediaUrl) return;
    setActiveTrack({
      id: song.id,
      title: song.title,
      artist: song.artist,
      uri: song.mediaUrl,
      duration: song.duration,
    });
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if ('canceled' in result && result.canceled) return;
    const assets =
      'assets' in result
        ? result.assets ?? []
        : (result as any).type === 'success'
        ? [result as any]
        : [];

    const pickedTracks = assets.map((asset, index) => ({
      id: `${asset.name ?? 'local'}-${Date.now()}-${index}`,
      title: asset.name ?? 'Local audio',
      artist: 'Local file',
      uri: asset.uri,
      duration: '--:--',
    }));

    setLocalTracks((prev) => [...pickedTracks, ...prev]);
  };

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if ('canceled' in result && result.canceled) return;
    const assets =
      'assets' in result
        ? result.assets ?? []
        : (result as any).type === 'success'
        ? [result as any]
        : [];
    const asset = assets[0];
    if (!asset) return;
    const newVideo = {
      id: `${asset.name ?? 'video'}-${Date.now()}`,
      title: asset.name ?? 'Local video',
      mediaUrl: asset.uri,
    };
    setVideoItems((prev) => [newVideo, ...prev]);
    setActiveVideo(newVideo);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    Your Library
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                    Favorites, playlists, downloads, and your local media.
                  </CustomText>
                </View>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.radius.md,
                    backgroundColor: `${theme.colors.primary}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="library-music" size={18} color={theme.colors.primary} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                {[
                  { label: 'Playlists', value: `${favouritePlaylists.length}` },
                  { label: 'Songs', value: `${allSongs.length}` },
                  { label: 'Videos', value: `${videoItems.length}` },
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

          <FadeIn delay={80}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: theme.spacing.md }}
            >
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Chip label="Library" active={tab === 'library'} onPress={() => setTab('library')} />
                <Chip label="Local" active={tab === 'local'} onPress={() => setTab('local')} />
                <Chip label="Videos" active={tab === 'videos'} onPress={() => setTab('videos')} />
                <Chip label="Downloads" active={tab === 'downloads'} onPress={() => setTab('downloads')} />
              </View>
            </ScrollView>
          </FadeIn>

          {tab === 'library' && (
            <FadeIn delay={140}>
              {activeTrack ? (
                <View style={{ marginTop: theme.spacing.md }}>
                  <AudioPlayer track={activeTrack} onClose={() => setActiveTrack(null)} />
                </View>
              ) : null}
              <View style={{ marginTop: theme.spacing.md }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Quick actions
                </CustomText>
                <View style={{ marginTop: theme.spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                  {[
                    { icon: 'shuffle', label: 'Shuffle', hint: 'Play random' },
                    { icon: 'download', label: 'Download', hint: 'Save offline' },
                    { icon: 'playlist-add', label: 'New Playlist', hint: 'Organize media' },
                    { icon: 'insights', label: 'Insights', hint: 'Usage summary' },
                  ].map((action) => (
                    <TouchableOpacity
                      key={action.label}
                      onPress={() => console.log(action.label)}
                      style={{
                        width: actionWidth,
                        padding: theme.spacing.md,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${theme.colors.primary}16`,
                          marginBottom: 8,
                        }}
                      >
                        <MaterialIcons name={action.icon as any} size={16} color={theme.colors.primary} />
                      </View>
                      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                        {action.label}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                        {action.hint}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <MediaRail
                  title="Favourite playlists"
                  actionLabel="Manage"
                  onAction={() => console.log('Manage playlists')}
                  data={favouritePlaylists}
                  renderItem={(playlist) => (
                    <PosterCard
                      key={playlist.id}
                      imageUrl={playlist.imageUrl}
                      title={playlist.title}
                      subtitle={`${playlist.songCount} songs`}
                      onPress={() => console.log('Open playlist', playlist.id)}
                      size="sm"
                    />
                  )}
                />
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  All songs
                </CustomText>
                <SurfaceCard
                  style={{
                    marginTop: theme.spacing.sm,
                    overflow: 'hidden',
                  }}
                >
                  <SongList
                    songs={allSongs}
                    onSongPress={onLibrarySongPress}
                    currentSongId={activeTrack?.id}
                  />
                </SurfaceCard>
              </View>
            </FadeIn>
          )}

          {tab === 'local' && (
            <FadeIn delay={140} style={{ marginTop: theme.spacing.md }}>
              <AppButton
                title="Import audio files"
                variant="outline"
                size="sm"
                onPress={pickAudio}
                leftIcon={<MaterialIcons name="library-music" size={18} color={theme.colors.primary} />}
              />

              {activeTrack ? (
                <View style={{ marginTop: theme.spacing.md }}>
                  <AudioPlayer track={activeTrack} onClose={() => setActiveTrack(null)} />
                </View>
              ) : null}

              <SurfaceCard
                style={{
                  marginTop: theme.spacing.md,
                  overflow: 'hidden',
                }}
              >
                <SongList
                  songs={localTracks.map((track) => ({
                    id: track.id,
                    title: track.title,
                    artist: track.artist || 'Local file',
                    album: 'Local',
                    duration: track.duration || '--:--',
                  }))}
                  onSongPress={(song) => {
                    const selected = localTracks.find((track) => track.id === song.id);
                    if (selected) setActiveTrack(selected);
                  }}
                  currentSongId={activeTrack?.id}
                />
              </SurfaceCard>

              {localTracks.length === 0 ? (
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.sm }}>
                  Import audio files from your device to play them here.
                </CustomText>
              ) : null}
            </FadeIn>
          )}

          {tab === 'videos' && (
            <FadeIn delay={140} style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
              <AppButton
                title="Add video"
                variant="outline"
                size="sm"
                onPress={pickVideo}
                leftIcon={<MaterialIcons name="video-library" size={18} color={theme.colors.primary} />}
              />

              {activeVideo ? (
                <VideoPlayer title={activeVideo.title} sourceUri={activeVideo.mediaUrl} />
              ) : null}

              <View style={{ gap: theme.spacing.sm }}>
                {videoItems.map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    onPress={() => setActiveVideo(video)}
                    style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceAlt,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                      <CustomText variant="body" style={{ color: theme.colors.text.primary }}>
                        {video.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                        Tap to play
                      </CustomText>
                    </View>
                    <MaterialIcons name="play-arrow" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </FadeIn>
          )}

          {tab === 'downloads' && (
            <FadeIn delay={140}>
              <SurfaceCard
                style={{
                  marginTop: theme.spacing.lg,
                  padding: theme.spacing.lg,
                }}
              >
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Downloads
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                  No downloads yet. Tap the download icon on any song or playlist to listen offline.
                </CustomText>
              </SurfaceCard>
            </FadeIn>
          )}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
