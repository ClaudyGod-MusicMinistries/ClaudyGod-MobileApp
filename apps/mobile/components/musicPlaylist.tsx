import React from 'react';
import { ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MediaCard } from './mediaCard';
import { CustomText } from './CustomText';
import { useAppTheme } from '../util/colorScheme';
import { makeStyles } from '../styles/makeStyles';
import { TVTouchable } from './ui/TVTouchable';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  playlistScrollContent: { paddingHorizontal: 16, paddingVertical: 8 },
  playlistItem:          { marginRight: 16 },
  songListWrap:          { paddingHorizontal: theme.spacing.md },
  rowBase: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9,
    paddingHorizontal: 6, borderBottomColor: theme.colors.border,
  },
  rowActive:    { backgroundColor: `${theme.colors.primary}12`, borderRadius: theme.radius.md },
  rowInactive:  { backgroundColor: 'transparent' },
  iconBoxBase: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  iconBoxActive:   { backgroundColor: `${theme.colors.primary}1E` },
  iconBoxInactive: { backgroundColor: theme.colors.surfaceAlt },
  indexText:    { color: theme.colors.textSecondary },
  metaFill:     { flex: 1, marginLeft: theme.spacing.sm },
  titleActive:  { color: theme.colors.primary },
  titleInactive: { color: theme.colors.text },
  captionText:  { color: theme.colors.textSecondary, marginTop: 2 },
  actionsEnd:   { alignItems: 'flex-end' },
  durationText: { color: theme.colors.textSecondary, fontSize: 10.5 },
  moreBtn:      { marginTop: 4 },
}));

// ─── Types ────────────────────────────────────────────────────────────────────

interface Playlist {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  songCount: number;
}

interface PlaylistGridProps {
  playlists: Playlist[];
  onPlaylistPress: (_playlist: Playlist) => void;
}

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
  onSongPress: (_song: Song) => void;
  currentSongId?: string;
  showActions?: boolean;
  onRemove?: (_song: Song) => void;
}

// ─── PlaylistGrid ─────────────────────────────────────────────────────────────

export const PlaylistGrid: React.FC<PlaylistGridProps> = ({ playlists, onPlaylistPress }) => {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.playlistScrollContent}
    >
      {playlists.map((playlist) => (
        <View key={playlist.id} style={styles.playlistItem}>
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

// ─── SongList ─────────────────────────────────────────────────────────────────

export const SongList: React.FC<SongListProps> = ({
  songs,
  onSongPress,
  currentSongId,
  showActions,
  onRemove,
}) => {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <View style={styles.songListWrap}>
      {songs.map((song, index) => {
        const active = currentSongId === song.id;

        return (
          <TVTouchable
            key={song.id}
            onPress={() => onSongPress(song)}
            style={[
              styles.rowBase,
              active ? styles.rowActive : styles.rowInactive,
              { borderBottomWidth: index !== songs.length - 1 ? 1 : 0 },
            ]}
            showFocusBorder={false}
          >
            <View style={[styles.iconBoxBase, active ? styles.iconBoxActive : styles.iconBoxInactive]}>
              {active ? (
                <MaterialIcons name="equalizer" size={18} color={theme.colors.primary} />
              ) : (
                <CustomText variant="caption" style={styles.indexText}>{index + 1}</CustomText>
              )}
            </View>

            <View style={styles.metaFill}>
              <CustomText
                variant="body"
                style={active ? styles.titleActive : styles.titleInactive}
                numberOfLines={1}
              >
                {song.title}
              </CustomText>
              <CustomText variant="caption" style={styles.captionText} numberOfLines={1}>
                {[song.artist, song.album].filter(Boolean).join(' · ')}
              </CustomText>
            </View>

            <View style={styles.actionsEnd}>
              <CustomText variant="caption" style={styles.durationText}>
                {song.duration}
              </CustomText>
              {showActions && onRemove ? (
                <TVTouchable
                  onPress={() => onRemove(song)}
                  style={styles.moreBtn}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="more-horiz" size={16} color={theme.colors.textSecondary} />
                </TVTouchable>
              ) : null}
            </View>
          </TVTouchable>
        );
      })}
    </View>
  );
};
