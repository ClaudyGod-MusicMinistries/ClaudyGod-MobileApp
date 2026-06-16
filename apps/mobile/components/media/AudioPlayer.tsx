import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from '../ui/TVTouchable';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  uri: string;
  duration?: string;
  imageUrl?: string;
}

interface AudioPlayerProps {
  track: AudioTrack;
  autoPlay?: boolean;
  onClose?: () => void;
  compact?: boolean;
  onRegisterControls?: (_controls?: { pause: () => void; resume: () => void }) => void;
  onPlayStateChange?: (_isPlaying: boolean) => void;
  onProgress?: (_currentTime: number, _duration: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export function AudioPlayer({
  track,
  autoPlay = true,
  onClose,
  compact,
  onRegisterControls,
  onPlayStateChange,
  onProgress,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: AudioPlayerProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const player = useAudioPlayer(track.uri, { updateInterval: 350 });
  const status = useAudioPlayerStatus(player);
  const isCompact = Boolean(compact);

  const artScale = useRef(new Animated.Value(1)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const progressBarWidth = useRef(0);

  const artworkSize = isCompact ? 160 : Math.min(Math.round(width * 0.64), 290);

  // Animate artwork when track changes
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(artOpacity, { toValue: 0.3, duration: 140, useNativeDriver: true }),
        Animated.spring(artScale, { toValue: 0.91, useNativeDriver: true, friction: 8, tension: 120 }),
      ]),
      Animated.parallel([
        Animated.timing(artOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(artScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
  }, []);

  useEffect(() => {
    if (!status.isLoaded) return;
    if (autoPlay) { player.play(); return; }
    player.pause();
    void player.seekTo(0);
  }, [autoPlay, player, status.isLoaded, track.uri]);

  useEffect(() => {
    if (!status.isLoaded) return;
    onPlayStateChange?.(status.playing);
    onProgress?.(status.currentTime, status.duration ?? 0);
  }, [onPlayStateChange, onProgress, status.currentTime, status.duration, status.isLoaded, status.playing]);

  useEffect(() => {
    if (!status.isLoaded) return;
    onRegisterControls?.({ pause: () => player.pause(), resume: () => player.play() });
    return () => { onRegisterControls?.(undefined); player.pause(); };
  }, [onRegisterControls, player, status.isLoaded]);

  const togglePlay = useCallback(() => {
    if (!status.isLoaded) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status.playing) { player.pause(); return; }
    player.play();
  }, [player, status.isLoaded, status.playing]);

  const seekBySeconds = useCallback((delta: number) => {
    if (!status.isLoaded) return;
    const duration = Math.max(0, status.duration ?? 0);
    const current = Math.max(0, status.currentTime ?? 0);
    void player.seekTo(Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, current + delta)));
  }, [player, status.currentTime, status.duration, status.isLoaded]);

  const seekToFraction = useCallback((fraction: number) => {
    if (!status.isLoaded) return;
    const duration = Math.max(0, status.duration ?? 0);
    if (!duration) return;
    void Haptics.selectionAsync();
    void player.seekTo(Math.max(0, Math.min(duration, duration * fraction)));
  }, [player, status.duration, status.isLoaded]);

  const { progress, positionLabel, durationLabel, isPlaying } = useMemo(() => {
    if (!status.isLoaded) {
      return { progress: 0, positionLabel: '0:00', durationLabel: track.duration ?? '--:--', isPlaying: false };
    }
    const position = Math.max(0, Math.round((status.currentTime ?? 0) * 1000));
    const duration = Math.max(0, Math.round((status.duration ?? 0) * 1000));
    const safeDuration = duration > 0 ? duration : 1;
    return {
      progress: Math.min(1, position / safeDuration),
      positionLabel: formatMillis(position),
      durationLabel: duration ? formatMillis(duration) : track.duration ?? '--:--',
      isPlaying: status.playing,
    };
  }, [status.currentTime, status.duration, status.isLoaded, status.playing, track.duration]);

  const onProgressBarLayout = useCallback((e: LayoutChangeEvent) => {
    progressBarWidth.current = e.nativeEvent.layout.width;
  }, []);

  return (
    <View style={{ gap: isCompact ? 18 : 28 }}>

      {/* Close / header row (optional) */}
      {onClose ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <TVTouchable
            onPress={onClose}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' }}
            showFocusBorder={false}
          >
            <CustomText variant="caption" style={{ color: 'rgba(247,242,255,0.80)' }}>Close</CustomText>
          </TVTouchable>
        </View>
      ) : null}

      {/* Artwork */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          style={{
            width: artworkSize,
            height: artworkSize,
            borderRadius: isCompact ? 18 : 24,
            overflow: 'hidden',
            opacity: artOpacity,
            transform: [{ scale: artScale }],
            shadowColor: '#000',
            shadowOpacity: 0.55,
            shadowRadius: 44,
            shadowOffset: { width: 0, height: 28 },
            elevation: 22,
          }}
        >
          <Image
            source={{ uri: track.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      {/* Title & artist */}
      <View style={{ gap: 5, alignItems: 'center', paddingHorizontal: 20 }}>
        <CustomText
          variant="hero"
          style={{ color: '#F7F2FF', textAlign: 'center', fontSize: isCompact ? 17 : 20, fontWeight: '700' }}
          numberOfLines={2}
        >
          {track.title}
        </CustomText>
        <CustomText
          variant="subtitle"
          style={{ color: 'rgba(247,242,255,0.50)', textAlign: 'center', fontSize: 13 }}
          numberOfLines={1}
        >
          {track.artist || 'ClaudyGod'}
        </CustomText>
      </View>

      {/* Progress bar — interactive */}
      <View style={{ gap: 6, paddingHorizontal: 2 }}>
        <Pressable
          onLayout={onProgressBarLayout}
          onPress={(e) => {
            const barW = progressBarWidth.current;
            if (!barW) return;
            const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / barW));
            seekToFraction(fraction);
          }}
          style={{ paddingVertical: 10 }}
        >
          <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(247,242,255,0.12)', overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.primary,
              }}
            />
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
          <CustomText variant="caption" style={{ color: 'rgba(247,242,255,0.38)', fontSize: 10 }}>{positionLabel}</CustomText>
          <CustomText variant="caption" style={{ color: 'rgba(247,242,255,0.38)', fontSize: 10 }}>{durationLabel}</CustomText>
        </View>
      </View>

      {/* Playback controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: isCompact ? 8 : 14 }}>
        {onPrevious ? (
          <ControlButton icon="skip-previous" onPress={onPrevious} disabled={!canGoPrevious} size={isCompact ? 22 : 26} />
        ) : null}

        <ControlButton icon="replay-10" onPress={() => seekBySeconds(-10)} size={isCompact ? 22 : 24} />

        {/* Play/pause — primary CTA */}
        <TVTouchable
          onPress={togglePlay}
          style={{
            width: isCompact ? 68 : 80,
            height: isCompact ? 68 : 80,
            borderRadius: isCompact ? 34 : 40,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          showFocusBorder={false}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={isCompact ? 32 : 38}
            color="#FFFFFF"
          />
        </TVTouchable>

        <ControlButton icon="forward-10" onPress={() => seekBySeconds(10)} size={isCompact ? 22 : 24} />

        {onNext ? (
          <ControlButton icon="skip-next" onPress={onNext} disabled={!canGoNext} size={isCompact ? 22 : 26} />
        ) : null}
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  onPress,
  disabled,
  size = 24,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.32 : 1,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={size} color="rgba(247,242,255,0.78)" />
    </TVTouchable>
  );
}

function formatMillis(value: number) {
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? `0${seconds}` : String(seconds)}`;
}
