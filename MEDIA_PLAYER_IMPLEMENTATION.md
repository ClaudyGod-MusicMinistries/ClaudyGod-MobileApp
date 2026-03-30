# 📱 Media Player Implementation Guide

## Quick Start

### 1. Setup Provider in Root Layout

**File**: `app/_layout.tsx`

```typescript
import { MediaPlayerProvider } from '@/context/MediaPlayerContext';
import { MinimizedPlayer } from '@/components/player/MinimizedPlayer';

export default function RootLayout() {
  return (
    <MediaPlayerProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Your screens */}
      </Stack>
    </MediaPlayerProvider>
  );
}
```

### 2. Add Player to Tab Navigation

**File**: `app/(tabs)/_layout.tsx`

```typescript
import { MinimizedPlayer } from '@/components/player/MinimizedPlayer';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarShowLabel: true,
          tabBarActiveTintColor: COLORS.accent,
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="library" options={{ title: 'Library' }} />
      </Tabs>

      {/* Player shows at bottom, always visible when track is playing */}
      <MinimizedPlayer />
    </View>
  );
}
```

### 3. Create Player Screen Route

**File**: `app/player.tsx`

```typescript
import { FullPlayerScreen } from '@/components/player/FullPlayerScreen';

export default function PlayerScreen() {
  return <FullPlayerScreen />;
}
```

### 4. Play Track from Any Screen

```typescript
import { useMediaPlayer } from '@/hooks/useMediaPlayer';
import { Track } from '@/types/media';

export function TrackCard({ track }: { track: Track }) {
  const { play } = useMediaPlayer();

  return (
    <Pressable onPress={() => play(track)}>
      <Image source={{ uri: track.thumbnail }} />
      <Text>{track.title}</Text>
    </Pressable>
  );
}
```

---

## Core Features Implementation

### Playing a Track with Queue

```typescript
const { setQueue, play } = useMediaPlayer();

// Set playlist and start playing
const tracks = [track1, track2, track3];
setQueue(tracks, 0); // Starts playing first track
```

### Listen to Playback Changes

```typescript
const { currentTime, duration, isPlaying } = useMediaPlayer();

useEffect(() => {
  // Update UI when playback state changes
}, [isPlaying, currentTime]);
```

### Save and Restore Playback State

```typescript
const { currentTrack, currentTime, saveCurrentProgress } = useMediaPlayer();

// Automatically saves when app terminates
useEffect(() => {
  return () => {
    saveCurrentProgress();
  };
}, []);
```

---

## Background Playback

### How It Works

1. **User plays a track** from any screen
2. **MinimizedPlayer** shows track in footer
3. **User navigates to another tab** or app screen
4. **Native audio layer continues** playing in background
5. **MediaPlayerContext** maintains state
6. **User can control** from minimized player footer
7. **Tapping minimized player** opens full player screen

### Configuration

#### iOS (app.config.js)

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["audio"]
    }
  }
}
```

#### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<service android:name=".MediaPlaybackService" />
```

---

## State Persistence

### Auto-Save on Changes

```typescript
// In MediaPlayerContext.tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (currentTrack) {
      savePlayerState();
    }
  }, 1000);

  return () => clearTimeout(timer);
}, [currentTrack, currentTime, playbackRate]);
```

### Restore on App Start

```typescript
// In MediaPlayerContext.tsx
useEffect(() => {
  restorePlayerState(); // Called once on mount
}, []);
```

---

## Quality Switching

### Adaptive Bitrate

```typescript
const { setPlaybackRate } = useMediaPlayer();

// Change quality based on network
const getQuality = async () => {
  const info = await Network.getNetworkStateAsync();
  if (info.type === 'wifi') return '320kbps';
  if (info.type === 'cellular') return '192kbps';
  return '128kbps';
};
```

---

## Offline Playback

### Download Track

```typescript
async function downloadTrack(track: Track) {
  const localPath = `${FileSystem.documentDirectory}tracks/${track.id}.mp3`;
  
  await FileSystem.downloadAsync(
    track.downloadUrl!,
    localPath
  );

  track.localPath = localPath;
  track.isDownloaded = true;
}
```

### Play Offline

The service automatically uses `localPath` if offline:

```typescript
// In mediaPlayerService.ts
private async getStreamSource(track: Track): Promise<string> {
  if (!this.isNetworkAvailable() && track.localPath) {
    return track.localPath;
  }
  return track.streamUrl;
}
```

---

## Type Safety

### Track Interface

```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  coverUrl: string;
  type: 'audio' | 'video';
  streamUrl: string;
  qualities: { [key: string]: string };
  isLiked?: boolean;
  isSaved?: boolean;
}
```

### Using Types

```typescript
import { Track, Playlist, PlayerState } from '@/types/media';

function playTrack(track: Track) {
  const { play } = useMediaPlayer();
  play(track);
}
```

---

## Advanced Features

### Queue Management

```typescript
const { 
  queue, 
  currentIndex, 
  addToQueue, 
  removeFromQueue,
  setQueue 
} = useMediaPlayer();

// Add to queue
addToQueue(newTrack);

// Remove from queue
removeFromQueue(queueIndex);

// Replace entire queue
setQueue(tracks, startIndex);
```

### Repeat Modes

```typescript
const { repeatMode, setRepeatMode } = useMediaPlayer();

// Cycle through: off -> all -> one -> off
const modes = ['off', 'all', 'one'] as const;
const currentIdx = modes.indexOf(repeatMode);
const nextMode = modes[(currentIdx + 1) % modes.length];
setRepeatMode(nextMode);
```

### Shuffle

```typescript
const { isShuffled, toggleShuffle } = useMediaPlayer();

toggleShuffle(); // Enables/disables shuffle
```

### Playback Speed

```typescript
const { playbackRate, setPlaybackRate } = useMediaPlayer();

// Set to 1.5x speed
setPlaybackRate(1.5);
```

---

## Error Handling

```typescript
async function playTrackSafely(track: Track) {
  try {
    const { play } = useMediaPlayer();
    await play(track);
  } catch (error) {
    logger.error('Failed to play track:', error);
    // Show error to user
    Toast.show({
      type: 'error',
      text1: 'Playback Error',
      text2: 'Failed to play track. Please try again.',
    });
  }
}
```

---

## Performance Optimization

### Memoize Components

```typescript
import { memo } from 'react';

const TrackCard = memo(({ track }) => {
  return (
    <View>
      <Image source={{ uri: track.thumbnail }} />
      <Text>{track.title}</Text>
    </View>
  );
}, (prev, next) => prev.track.id === next.track.id);
```

### Prevent Unnecessary Re-renders

```typescript
const { 
  currentTrack, 
  isPlaying, 
  currentTime // Only grab what you need
} = useMediaPlayer();
```

### Use FlatList for Queues

```typescript
<FlatList
  data={queue}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <QueueItem track={item} />}
/>
```

---

## Testing

### Mock useMediaPlayer

```typescript
jest.mock('@/hooks/useMediaPlayer', () => ({
  useMediaPlayer: () => ({
    currentTrack: mockTrack,
    isPlaying: false,
    play: jest.fn(),
    pause: jest.fn(),
  }),
}));
```

### Test Player Component

```typescript
describe('MinimizedPlayer', () => {
  it('should display current track', () => {
    const { getByText } = render(<MinimizedPlayer />);
    expect(getByText('Track Title')).toBeTruthy();
  });

  it('should call play when play button pressed', () => {
    const { getByLabelText } = render(<MinimizedPlayer />);
    fireEvent.press(getByLabelText('Play'));
    expect(mockPlay).toHaveBeenCalled();
  });
});
```

---

## Deployment Considerations

### Production Checklist

- [ ] Configure streaming URLs for production API
- [ ] Set up CDN for album art and covers
- [ ] Enable HTTPS for all streaming
- [ ] Implement analytics tracking
- [ ] Set rate limiting on streaming endpoint
- [ ] Test offline playback thoroughly
- [ ] Configure proper error messages
- [ ] Test on real devices (iPhone and Android)
- [ ] Verify background audio works when device locked
- [ ] Test state persistence after force quit

### Environment Setup

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.claudygod.com
EXPO_PUBLIC_ENV=production
```

---

## Common Issues & Solutions

### Audio Not Playing in Background

**Solution**: Ensure `UIBackgroundModes: ['audio']` is set in app.json

### State Not Persisting

**Solution**: Call `saveCurrentProgress()` explicitly when needed

### Quality Too Low on WiFi

**Solution**: Check network detection logic in `getOptimalQuality()`

### Context Not Available

**Solution**: Ensure component is wrapped by `MediaPlayerProvider`

### Video Won't Play

**Solution**: Use `expo-video` instead of `expo-av` for video tracks

---

## File Structure

```
apps/mobile/
├── context/
│   └── MediaPlayerContext.tsx      # Global state
├── services/
│   └── media/
│       └── mediaPlayerService.ts   # Playback logic
├── components/
│   └── player/
│       ├── MinimizedPlayer.tsx     # Footer player
│       └── FullPlayerScreen.tsx    # Full screen player
├── hooks/
│   └── useMediaPlayer.ts           # Context hook
├── types/
│   └── media.ts                    # TypeScript interfaces
├── utils/
│   └── media.ts                    # Helper functions
└── app/
    └── player.tsx                  # Player route
```

---

## Summary

This architecture provides:
- ✅ **Background playback** across screen navigation
- ✅ **State persistence** between app sessions  
- ✅ **Type-safe** interfaces and hooks
- ✅ **Offline support** with downloaded tracks
- ✅ **Quality adaptation** based on network
- ✅ **Full control** from minimized player
- ✅ **Professional UX** with smooth transitions

Ready for production use!
