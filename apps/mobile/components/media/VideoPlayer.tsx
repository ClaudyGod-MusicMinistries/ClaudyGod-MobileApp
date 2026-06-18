import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Platform, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { isHostedVideoUrl } from '../../util/playerRoute';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
  const [webError, setWebError] = useState(false);
  const [webLoaded, setWebLoaded] = useState(false);
  const shimmerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setWebError(false);
    setWebLoaded(false);
    shimmerOpacity.setValue(1);
  }, [shimmerOpacity, sourceUri]);

  const handleWebLoaded = () => {
    setWebLoaded(true);
    Animated.timing(shimmerOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      {embedUrl && !webError ? (
        <View style={{ width: '100%', height }}>
          {/* Shimmer while loading */}
          {!webLoaded ? (
            <Animated.View
              style={{
                position: 'absolute', inset: 0,
                backgroundColor: '#0E0918',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: shimmerOpacity,
                zIndex: 10,
              }}
            >
              <MaterialIcons name="smart-display" size={40} color="rgba(139,92,246,0.4)" />
            </Animated.View>
          ) : null}

          <WebView
            source={{ uri: embedUrl }}
            style={{ width: '100%', height, backgroundColor: '#000000' }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            onLoad={handleWebLoaded}
            onError={() => { setWebError(true); }}
          />

          {/* YouTube fallback — opens in YouTube app */}
          {webLoaded ? (
            <TouchableOpacity
              onPress={() => { void Linking.openURL(sourceUri); }}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(0,0,0,0.55)',
                borderRadius: 20,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.75}
            >
              <MaterialIcons name="open-in-new" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : embedUrl && webError ? (
        /* WebView failed — show fallback link */
        <View style={{ width: '100%', height, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#0E0918' }}>
          <MaterialIcons name="play-circle-outline" size={48} color="rgba(139,92,246,0.5)" />
          <CustomText variant="body" style={{ color: 'rgba(247,242,255,0.55)', textAlign: 'center' }}>
            Could not load video
          </CustomText>
          <TouchableOpacity
            onPress={() => { void Linking.openURL(sourceUri); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: 'rgba(139,92,246,0.18)',
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 8,
            }}
          >
            <MaterialIcons name="open-in-new" size={15} color="#8B5CF6" />
            <CustomText style={{ color: '#8B5CF6', fontSize: 13, fontWeight: '600' }}>
              Watch on YouTube
            </CustomText>
          </TouchableOpacity>
        </View>
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
    return () => { onRegisterControls?.(undefined); };
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
      if (onProgress) onProgress(currentTime, duration);
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
  if (!value || !isHostedVideoUrl(value)) return null;

  const params = 'autoplay=1&rel=0&modestbranding=1&playsinline=1';

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}?${params}` : null;
    }

    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}?${params}` : null;
    }

    if (host.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1` : null;
    }
  } catch {
    return null;
  }

  return null;
}
