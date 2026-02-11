// app/(tabs)/Favourites.tsx
import React, { useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
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

export default function Favourites() {
  const theme = useAppTheme();
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
          <CustomText variant="title" style={{ color: theme.colors.text.primary }}>
            Your Library
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
            Favorites, playlists, and offline downloads.
          </CustomText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: theme.spacing.sm }}
          >
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Chip label="Library" active={tab === 'library'} onPress={() => setTab('library')} />
              <Chip label="Local" active={tab === 'local'} onPress={() => setTab('local')} />
              <Chip label="Videos" active={tab === 'videos'} onPress={() => setTab('videos')} />
              <Chip label="Downloads" active={tab === 'downloads'} onPress={() => setTab('downloads')} />
            </View>
          </ScrollView>

          {tab === 'library' && (
            <>
              {activeTrack ? (
                <View style={{ marginTop: theme.spacing.md }}>
                  <AudioPlayer track={activeTrack} onClose={() => setActiveTrack(null)} />
                </View>
              ) : null}
              <View style={{ marginTop: theme.spacing.md }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Quick actions
                </CustomText>
                <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
                  {[
                    { icon: 'shuffle', label: 'Shuffle' },
                    { icon: 'download', label: 'Download' },
                    { icon: 'playlist-add', label: 'New Playlist' },
                  ].map((action) => (
                    <TouchableOpacity
                      key={action.label}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderRadius: 8,
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <MaterialIcons name={action.icon as any} size={16} color={theme.colors.primary} />
                      <CustomText variant="label" style={{ color: theme.colors.text.primary, marginLeft: 8 }}>
                        {action.label}
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
                <View
                  style={{
                    marginTop: theme.spacing.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <SongList
                    songs={allSongs}
                    onSongPress={onLibrarySongPress}
                    currentSongId={activeTrack?.id}
                  />
                </View>
              </View>
            </>
          )}

          {tab === 'local' && (
            <View style={{ marginTop: theme.spacing.md }}>
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

              <View
                style={{
                  marginTop: theme.spacing.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surface,
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
              </View>

              {localTracks.length === 0 ? (
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.sm }}>
                  Import audio files from your device to play them here.
                </CustomText>
              ) : null}
            </View>
          )}

          {tab === 'videos' && (
            <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
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
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
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
            </View>
          )}

          {tab === 'downloads' && (
            <View
              style={{
                marginTop: theme.spacing.lg,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                Downloads
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                No downloads yet. Tap the download icon on any song or playlist to listen offline.
              </CustomText>
            </View>
          )}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}
