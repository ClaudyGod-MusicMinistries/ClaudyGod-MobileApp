// components/music/PlaylistGrid.tsx
import { ScrollView, View } from 'react-native';
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

// components/music/SongList.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { CustomText } from './CustomText';
import { MaterialIcons } from '@expo/vector-icons';

export interface Song {
    id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
}

interface SongListProps {
  songs: Song[];
  onSongPress: (song: Song) => void;
  currentSongId?: string;
    showActions?: boolean; // Add this
  onRemove?: (song: Song) => void; // Add this
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
