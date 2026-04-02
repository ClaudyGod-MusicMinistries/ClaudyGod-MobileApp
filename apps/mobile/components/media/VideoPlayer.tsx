import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { isHostedVideoUrl } from '../../util/playerRoute';

interface VideoPlayerProps {
  title?: string;
  sourceUri: string;
  height?: number;
  onRegisterControls?: (_controls?: { pause: () => void; resume: () => void }) => void;
  onPlayStateChange?: (_isPlaying: boolean) => void;
  onProgress?: (_currentTime: number, _duration: number) => void;
}

export function VideoPlayer({
  title,
  sourceUri,
  height = 210,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
}: VideoPlayerProps) {
  const theme = useAppTheme();
  const embedUrl = useMemo(() => buildEmbedUrl(sourceUri), [sourceUri]);

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      {embedUrl ? (
        <WebView
          source={{ uri: embedUrl }}
          style={{ width: '100%', height, backgroundColor: '#000000' }}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      ) : (
        <NativeVideoPlayer
          sourceUri={sourceUri}
          height={height}
          onRegisterControls={onRegisterControls}
          onPlayStateChange={onPlayStateChange}
          onProgress={onProgress}
        />
      )}

      {title ? (
        <View style={{ padding: theme.spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
            {title}
          </CustomText>
        </View>
      ) : null}
    </View>
  );
}

function NativeVideoPlayer({
  sourceUri,
  height,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
}: {
  sourceUri: string;
  height: number;
  onRegisterControls?: (_controls?: { pause: () => void; resume: () => void }) => void;
  onPlayStateChange?: (_isPlaying: boolean) => void;
  onProgress?: (_currentTime: number, _duration: number) => void;
}) {
  const player = useVideoPlayer(sourceUri, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.staysActiveInBackground = false;
  });

  useEffect(() => {
    onRegisterControls?.({
      pause: () => player.pause(),
      resume: () => player.play(),
    });

    return () => {
      onRegisterControls?.(undefined);
    };
  }, [onRegisterControls, player]);

  useEffect(() => {
    if (!onProgress && !onPlayStateChange) return;

    const playback = player as unknown as {
      playing?: boolean;
      currentTime?: number;
      duration?: number;
    };

    let lastPlaying = playback.playing;

    const tick = () => {
      const currentTime = typeof playback.currentTime === 'number' ? playback.currentTime : 0;
      const duration = typeof playback.duration === 'number' ? playback.duration : 0;
      if (onProgress) {
        onProgress(currentTime, duration);
      }
      if (typeof playback.playing === 'boolean' && playback.playing !== lastPlaying) {
        lastPlaying = playback.playing;
        onPlayStateChange?.(playback.playing);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [onPlayStateChange, onProgress, player]);

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height }}
      nativeControls
      contentFit="cover"
      fullscreenOptions={{ enable: true }}
    />
  );
}

function buildEmbedUrl(sourceUri: string): string | null {
  const value = String(sourceUri || '').trim();
  if (!value || !isHostedVideoUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
