# 🎵 Professional Media Player Architecture

## Overview

The media player is designed to:
1. **Continue playing in background** when user navigates away
2. **Persist playback state** across app restarts
3. **Work offline** with downloaded content
4. **Support multiple media types** (audio, video)
5. **High-quality audio** with adaptive bitrate

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UI LAYER                                 │
│  ┌─────────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ Full Player     │  │ Minimized   │  │ Now Playing  │   │
│  │ (Expanded)      │  │ Player      │  │ on Home      │   │
│  │                 │  │ (Footer)    │  │              │   │
│  └────────┬────────┘  └─────┬───────┘  └────────┬─────┘   │
│           │                  │                    │          │
└───────────┼──────────────────┼────────────────────┼──────────┘
            │                  │                    │
            └──────────────────┼────────────────────┘
                               ↓
        ┌──────────────────────────────────────────┐
        │    MediaPlayerContext (Global State)     │
        │  ────────────────────────────────────────│
        │  - currentTrack                          │
        │  - playbackState                         │
        │  - queue & playlist                      │
        │  - playbackPosition                      │
        │  - isPlaying, isPaused, isLoading       │
        │  - volume & repeatMode                   │
        │  - Persists to AsyncStorage              │
        └─────────────────────┬────────────────────┘
                              ↓
        ┌──────────────────────────────────────────┐
        │    mediaPlayerService (Native Module)    │
        │  ────────────────────────────────────────│
        │  - Actual audio/video playback           │
        │  - Background playback control           │
        │  - Quality management                    │
        │  - Progress tracking                     │
        │  - Playback notifications                │
        └─────────────────────┬────────────────────┘
                              ↓
        ┌──────────────────────────────────────────┐
        │    Native Media Module (Expo AV / RNM)   │
        │  ────────────────────────────────────────│
        │  - iOS AVAudioPlayer                     │
        │  - Android MediaPlayer/ExoPlayer         │
        │  - Background Modes & Permissions        │
        └──────────────────────────────────────────┘
```

---

## Component Structure

### 1. MediaPlayerContext
**File**: `context/MediaPlayerContext.tsx`

```typescript
interface MediaPlayerContextType {
  // Current Media
  currentTrack: Track | null;
  currentPlaylist: Playlist | null;
  queue: Track[];
  currentIndex: number;

  // Playback State
  playbackState: 'playing' | 'paused' | 'stopped' | 'loading';
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;

  // Playback Info
  currentTime: number; // seconds
  duration: number; // seconds
  bufferedTime: number;
  buffering: boolean;

  // Playback Controls
  playbackRate: number; // 0.5x to 2x
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
  volume: number; // 0-1

  // Actions
  play(track: Track): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(time: number): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  setVolume(volume: number): void;
  setRepeatMode(mode: 'off' | 'one' | 'all'): void;
  toggleShuffle(): void;
  setPlaybackRate(rate: number): void;

  // Queue Management
  setQueue(tracks: Track[], startIndex?: number): void;
  addToQueue(track: Track): void;
  removeFromQueue(index: number): void;
  clearQueue(): void;

  // Playlist Support
  setPlaylist(playlist: Playlist): void;
  saveCurrentProgress(): Promise<void>;
}

Provider wraps entire app with <MediaPlayerProvider>
```

### 2. Tab Navigation Layout
**File**: `app/(tabs)/_layout.tsx`

```typescript
export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarShowLabel: true,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{ title: 'Dashboard' }}
        />
        <Tabs.Screen
          name="home"
          options={{ title: 'Home' }}
        />
        <Tabs.Screen
          name="videos"
          options={{ title: 'Videos' }}
        />
        <Tabs.Screen
          name="library"
          options={{ title: 'Library' }}
        />
        <Tabs.Screen
          name="live"
          options={{ title: 'Live' }}
        />
      </Tabs>

      {/* Minimized Player - Always Visible */}
      <MinimizedPlayer />
    </View>
  );
}
```

### 3. Minimized Player (Footer)
**File**: `components/player/MinimizedPlayer.tsx`

```typescript
export function MinimizedPlayer() {
  const { currentTrack, isPlaying, play, pause, next } = useMediaPlayer();
  const navigation = useNavigation();

  if (!currentTrack) return null;

  return (
    <PressableOpacity
      onPress={() => navigation.navigate('player')}
      style={styles.container}
    >
      {/* Track Info */}
      <FastImage
        source={{ uri: currentTrack.thumbnail }}
        style={styles.thumbnail}
      />
      
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>
          {currentTrack.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Controls */}
      <PressableOpacity
        onPress={() => isPlaying ? pause() : play()}
        style={styles.playButton}
      >
        <MaterialIcons
          name={isPlaying ? 'pause' : 'play-arrow'}
          size={28}
          color={COLORS.accent}
        />
      </PressableOpacity>

      <PressableOpacity
        onPress={next}
        style={styles.nextButton}
      >
        <MaterialIcons
          name="skip-next"
          size={24}
          color={COLORS.textSecondary}
        />
      </PressableOpacity>

      {/* Progress Bar */}
      <ProgressBar progress={progress} />
    </PressableOpacity>
  );
}
```

### 4. Full Player Screen
**File**: `app/player/index.tsx`

```typescript
export default function FullPlayerScreen() {
  const { currentTrack, /* ... other state */ } = useMediaPlayer();
  const [showQueue, setShowQueue] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Album Art */}
      <AlbumArt track={currentTrack} />

      {/* Track Info */}
      <TrackInfo track={currentTrack} />

      {/* Progress Bar */}
      <ProgressBar />

      {/* Playback Controls */}
      <PlayerControls />

      {/* Secondary Controls */}
      <SecondaryControls
        onQueuePress={() => setShowQueue(true)}
        onSettingsPress={() => {/* open settings */}}
      />

      {/* Queue Modal */}
      <QueueModal visible={showQueue} onClose={() => setShowQueue(false)} />
    </SafeAreaView>
  );
}
```

---

## Service Layer

### mediaPlayerService
**File**: `services/media/mediaPlayerService.ts`

```typescript
class MediaPlayerService {
  private sound: Sound | null = null;
  private videoPlayer: VideoPlayer | null = null;
  private currentTrack: Track | null = null;
  private listeners: ((state: PlayerState) => void)[] = [];

  /**
   * Play a track (audio or video)
   */
  async play(track: Track, startPosition: number = 0): Promise<void> {
    try {
      // Stop current playback
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Determine source
      const source = await this.getStreamSource(track);

      if (track.type === 'audio') {
        // Load audio
        const { sound } = await Audio.Sound.createAsync(
          { uri: source },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 1000,
            positionMillis: startPosition * 1000,
          },
          this.onPlaybackStatusUpdate.bind(this)
        );
        this.sound = sound;
      } else {
        // Load video
        this.videoPlayer = new VideoPlayer(source);
        await this.videoPlayer.play();
      }

      this.currentTrack = track;
      this.notifyListeners();
    } catch (error) {
      logger.error('Error playing track:', error);
      throw error;
    }
  }

  /**
   * Pause current playback
   */
  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    } else if (this.videoPlayer) {
      await this.videoPlayer.pause();
    }
    this.notifyListeners();
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    } else if (this.videoPlayer) {
      await this.videoPlayer.play();
    }
    this.notifyListeners();
  }

  /**
   * Seek to position
   */
  async seek(position: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(position * 1000);
    } else if (this.videoPlayer) {
      await this.videoPlayer.seek(position);
    }
  }

  /**
   * Stop playback
   */
  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    } else if (this.videoPlayer) {
      await this.videoPlayer.stop();
      this.videoPlayer = null;
    }
    this.currentTrack = null;
    this.notifyListeners();
  }

  /**
   * Set volume (0-1)
   */
  async setVolume(volume: number): Promise<void> {
    volume = Math.max(0, Math.min(1, volume));
    if (this.sound) {
      await this.sound.setVolumeAsync(volume);
    } else if (this.videoPlayer) {
      await this.videoPlayer.setVolume(volume);
    }
  }

  /**
   * Set playback rate
   */
  async setPlaybackRate(rate: number): Promise<void> {
    if (this.sound) {
      await this.sound.setRateAsync(rate);
    } else if (this.videoPlayer) {
      await this.videoPlayer.setPlaybackRate(rate);
    }
  }

  /**
   * Get stream source with quality
   */
  private async getStreamSource(track: Track): Promise<string> {
    // If offline, use local file
    if (!isNetworkAvailable() && track.localPath) {
      return track.localPath;
    }

    // Get best quality based on connection
    const quality = await this.getOptimalQuality();
    return `${STREAMING_URL}/audio/${track.id}/stream?quality=${quality}`;
  }

  /**
   * Determine optimal quality based on network
   */
  private async getOptimalQuality(): Promise<string> {
    const info = await Network.getNetworkStateAsync();
    if (info.type === 'wifi') return '320kbps';
    if (info.type === 'cellular') return '192kbps';
    return '128kbps';
  }

  /**
   * Listen for playback updates
   */
  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (status.isLoaded && !status.isBuffering) {
      // Update context with new position
      // Emit progress event
    }
  }

  /**
   * Register listener for state changes
   */
  onStateChange(listener: (state: PlayerState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Get current player state
   */
  getState(): PlayerState {
    return {
      isPlaying: this.sound ? this.sound.isPlaying : false,
      currentTime: this.sound ? this.sound.positionMillis / 1000 : 0,
      duration: this.sound ? this.sound.durationMillis / 1000 : 0,
      currentTrack: this.currentTrack,
    };
  }
}

export const mediaPlayerService = new MediaPlayerService();
```

---

## State Persistence

### AsyncStorage Integration
**File**: `services/storage/playerStateService.ts`

```typescript
const PLAYER_STATE_KEY = '@claudygod/playerState';

export async function savePlayerState(state: {
  currentTrack: Track;
  position: number;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
}): Promise<void> {
  await AsyncStorage.setItem(
    PLAYER_STATE_KEY,
    JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    })
  );
}

export async function restorePlayerState(): Promise<PlayerState | null> {
  const saved = await AsyncStorage.getItem(PLAYER_STATE_KEY);
  return saved ? JSON.parse(saved) : null;
}
```

---

## Background Playback Setup

### iOS Configuration
**File**: `app.json` (Expo)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone.",
          "mediaLibraryPermission": "Allow $(PRODUCT_NAME) to access your media library."
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "audio"
        ],
        "AVFoundationCameraUsageDescription": "Allow access to camera for video playback",
        "AVFoundationMicrophoneUsageDescription": "Allow access to microphone for recording"
      }
    }
  }
}
```

### Android Configuration
**File**: `android/app/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
  
  <!-- Allow playback in background -->
  <application>
    <service
      android:name=".MediaPlaybackService"
      android:foreground="true" />
  </application>
</manifest>
```

---

## Data Flow: Playing a Track Across Tabs

```
User Selects Track from Home Screen
         ↓
Call useMediaPlayer().play(track)
         ↓
Update MediaPlayerContext
         ↓
mediaPlayerService.play(track)
         ↓
Expo AV starts native playback
         ↓
MinimizedPlayer in footer shows track
         ↓
User navigates to Dashboard
         ↓
Playback CONTINUES (native layer)
         ↓
MinimizedPlayer still visible, still playing
         ↓
User taps MinimizedPlayer
         ↓
Navigate to full player screen
         ↓
Show full player UI with controls
         ↓
All controls work (pause, seek, next, previous)
```

---

## Type Definitions

**File**: `types/media.ts`

```typescript
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album?: string;
  duration: number; // seconds
  thumbnail: string;
  coverUrl: string;
  type: 'audio' | 'video';
  genre: string;
  releaseDate: string;
  
  // Playback info
  streamUrl: string;
  downloadUrl?: string;
  localPath?: string; // for offline
  qualities: {
    [key: string]: string; // 'quality': 'url'
  };
  
  // Engagement
  plays: number;
  likes: number;
  shares: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isDownloaded?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  isCreated: boolean; // user created
  creatorId: string;
  followerCount: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Queue {
  tracks: Track[];
  currentIndex: number;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  currentTrack: Track | null;
  queue: Queue | null;
  volume: number;
  playbackRate: number;
}
```

---

## Usage in Components

```typescript
import { useMediaPlayer } from '@/hooks/useMediaPlayer';

export function TrackCard({ track }: { track: Track }) {
  const { play, currentTrack } = useMediaPlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <Pressable onPress={() => play(track)}>
      <Image source={{ uri: track.thumbnail }} />
      <Text>{track.title}</Text>
      <Text>{track.artist}</Text>
      {isCurrentTrack && <PlayingIndicator />}
    </Pressable>
  );
}
```

---

## Key Features

✅ **Background Playback** - Continues when user leaves player  
✅ **State Persistence** - Resumes from last position  
✅ **Offline Support** - Play downloaded tracks  
✅ **Quality Switching** - Adaptive bitrate  
✅ **Progress Tracking** - Analytics on playback  
✅ **Queue Management** - Play in order  
✅ **Playlist Support** - Save and reuse playlists  
✅ **Video Support** - Play videos fullscreen  

This architecture provides a **professional, scalable media player** for production use.
