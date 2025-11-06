// components/musicPlaylist/index.tsx
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  imageUrl?: string;
  addedDate?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  songCount: number;
}

export interface SongListProps {
  songs: Song[];
  onSongPress: (song: Song) => void;
  showActions?: boolean;
  onRemove?: (song: Song) => void;
}

export interface PlaylistGridProps {
  playlists: Playlist[];
  onPlaylistPress: (playlist: Playlist) => void;
}