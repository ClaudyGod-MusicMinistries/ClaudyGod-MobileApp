import React from 'react';
import { ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MediaCard } from './mediaCard';
import { CustomText } from './CustomText';
import { useAppTheme } from '../util/colorScheme';
import { TVTouchable } from './ui/TVTouchable';

interface Playlist {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  songCount: number;
}

interface PlaylistGridProps {
  playlists: Playlist[];
  onPlaylistPress: (playlist: Playlist) => void;
}

export const PlaylistGrid: React.FC<PlaylistGridProps> = ({ playlists, onPlaylistPress }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {playlists.map((playlist) => (
        <View key={playlist.id} style={{ marginRight: 16 }}>
          <MediaCard
            imageUrl={playlist.imageUrl}
            title={playlist.title}
            subtitle={`${playlist.songCount} songs`}
            onPress={() => onPlaylistPress(playlist)}
            size="md"
          />
        </View>
      ))}
    </ScrollView>
  );
};

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  mediaUrl?: string;
}

interface SongListProps {
  songs: Song[];
  onSongPress: (song: Song) => void;
  currentSongId?: string;
  showActions?: boolean;
  onRemove?: (song: Song) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  onSongPress,
  currentSongId,
  showActions,
  onRemove,
}) => {
  const theme = useAppTheme();

  return (
    <View style={{ paddingHorizontal: theme.spacing.md }}>
      {songs.map((song, index) => {
        const active = currentSongId === song.id;
        return (
          <TVTouchable
            key={song.id}
            onPress={() => onSongPress(song)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: index !== songs.length - 1 ? 1 : 0,
              borderBottomColor: theme.colors.border,
              backgroundColor: active ? `${theme.colors.primary}14` : 'transparent',
              borderRadius: active ? theme.radius.md : 0,
              paddingHorizontal: 6,
            }}
            showFocusBorder={false}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? `${theme.colors.primary}22` : theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              {active ? (
                <MaterialIcons name="equalizer" size={18} color={theme.colors.primary} />
              ) : (
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                  {index + 1}
                </CustomText>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
              <CustomText
                variant="body"
                style={{
                  color: active ? theme.colors.primary : theme.colors.text.primary,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {song.title}
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
                {song.artist}
              </CustomText>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                {song.duration}
              </CustomText>
              {showActions && onRemove ? (
                <TVTouchable
                  onPress={() => onRemove(song)}
                  style={{ marginTop: 4 }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="more-horiz" size={16} color={theme.colors.text.secondary} />
                </TVTouchable>
              ) : null}
            </View>
          </TVTouchable>
        );
      })}
    </View>
  );
};
