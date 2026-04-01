/**
 * Media types and interfaces for music and video playback
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album?: string;
  albumId?: string;
  duration: number; // seconds
  thumbnail: string; // Small image URL
  coverUrl: string; // Large album art URL
  type: 'audio' | 'video';
  genre: string;
  releaseDate: string;
  explicit: boolean;

  // Streaming URLs
  streamUrl: string;
  downloadUrl?: string;
  localPath?: string; // Path to local file for offline playback

  // Quality options
  qualities: {
    [key: string]: string; // 'quality': 'url'
  };

  // Engagement metrics
  plays: number;
  likes: number;
  shares: number;
  comments: number;

  // User engagement state
  isLiked?: boolean;
  isSaved?: boolean;
  isDownloaded?: boolean;
  isAvailableOffline?: boolean;

  // Metadata
  lyrics?: string;
  isrc?: string; // International Standard Recording Code
  writers?: string[];
  producers?: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  totalDuration: number; // seconds
  trackCount: number;
  isCreated: boolean; // user created vs curated
  isPublic: boolean;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string;

  // Engagement
  followerCount: number;
  playCount: number;
  likes: number;

  // User state
  isFollowing?: boolean;
  isLiked?: boolean;

  // Dates
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  description?: string;
  releaseDate: string;
  tracks: Track[];
  trackCount: number;
  totalDuration: number;
  genre: string;
  isExplicit: boolean;

  // Engagement
  plays: number;
  likes: number;
  shares: number;

  // User state
  isLiked?: boolean;
  isSaved?: boolean;

  // Labels and copyright
  label?: string;
  copyright?: string;
}

export interface Queue {
  tracks: Track[];
  currentIndex: number;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
  originalOrder?: Track[]; // For shuffle - keeps original order
}

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number; // seconds
  duration: number; // seconds
  bufferedTime: number; // seconds
  currentTrack: Track | null;
  queue: Queue | null;
  volume: number; // 0-1
  playbackRate: number; // playback speed multiplier
  buffering: boolean;
  error?: string;
}

export interface PlaybackHistory {
  trackId: string;
  thumbnail: string;
  playedAt: string;
  duration: number;
  positionStopped: number; // Where user stopped
}

export interface DownloadedTrack {
  track: Track;
  localPath: string;
  fileSize: number;
  downloadedAt: string;
  isComplete: boolean;
  quality: string;
}

export interface MediaEngagement {
  trackId: string;
  isLiked: boolean;
  isSaved: boolean;
  isShared: boolean;
  playCount: number;
  lastPlayedAt: string;
  totalTimeListened: number; // seconds
}

export interface StreamingQuality {
  label: string; // "High", "Medium", "Low"
  bitrate: string; // "320kbps", "192kbps", etc
  url: string;
  fileSize?: number;
}

export interface NowPlayingItem {
  track: Track;
  playlist?: Playlist;
  album?: Album;
  addedAt: string;
  addedBy?: string;
}
