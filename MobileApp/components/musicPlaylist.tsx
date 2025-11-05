// components/music/PlaylistGrid.tsx

import { Grid } from './Grid';
import { MediaCard } from './mediaCard';

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

export const PlaylistGrid: React.FC<PlaylistGridProps> = ({
  playlists,
  onPlaylistPress
}) => {
  return (
    <Grid cols={2} gap={4}>
      {playlists.map((playlist) => (
        <MediaCard
          key={playlist.id}
          imageUrl={playlist.imageUrl}
          title={playlist.title}
          subtitle={`${playlist.songCount} songs`}
          onPress={() => onPlaylistPress(playlist)}
          size="md"
        />
      ))}
    </Grid>
  );
};

// components/music/SongList.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { CustomText } from './CustomText';
import { MaterialIcons } from '@expo/vector-icons';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  album: string;
}

interface SongListProps {
  songs: Song[];
  onSongPress: (song: Song) => void;
  currentSongId?: string;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  onSongPress,
  currentSongId
}) => {
  return (
    <View className="px-4">
      {songs.map((song, index) => (
        <TouchableOpacity
          key={song.id}
          onPress={() => onSongPress(song)}
          className={`flex-row items-center py-3 ${index !== songs.length - 1 ? 'border-b border-gray-800' : ''}`}
        >
          <View className="w-8 items-center">
            {currentSongId === song.id ? (
              <MaterialIcons name="equalizer" size={20} color="#E1306C" />
            ) : (
              <CustomText variant="caption" className="text-gray-500">
                {index + 1}
              </CustomText>
            )}
          </View>
          
          <View className="flex-1 ml-3">
            <CustomText 
              variant="body" 
              className={`${currentSongId === song.id ? 'text-purple-500' : 'text-white'} font-semibold`}
            >
              {song.title}
            </CustomText>
            <CustomText variant="caption" className="text-gray-400">
              {song.artist}
            </CustomText>
          </View>
          
          <CustomText variant="caption" className="text-gray-500">
            {song.duration}
          </CustomText>
        </TouchableOpacity>
      ))}
    </View>
  );
};