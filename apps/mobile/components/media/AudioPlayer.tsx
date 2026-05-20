import React, { useEffect, useMemo } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
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

type GradientWithPlayer = {
  player?: [string, string, string];
};

type RadiusWithXXL = {
  xxl?: number;
};

type ShadowsWithGlow = {
  glow?: object;
};

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
  const player = useAudioPlayer(track.uri, { updateInterval: 350 });
  const status = useAudioPlayerStatus(player);
  const isCompact = Boolean(compact);

  const playerGradient =
    (theme.colors.gradient as unknown as GradientWithPlayer).player ??
    (theme.scheme === 'dark'
      ? (['rgba(30,22,52,0.98)', 'rgba(12,8,22,0.99)', 'rgba(5,4,10,1)'] as [string, string, string])
      : (['#FFFFFF', '#F3EFFD', '#EDE7FB'] as [string, string, string]));

  const cardRadius = (theme.radius as typeof theme.radius & RadiusWithXXL).xxl ?? theme.radius.xl;
  const glowShadow = (theme.shadows as typeof theme.shadows & ShadowsWithGlow).glow ?? theme.shadows.card;

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

    if (autoPlay) {
      player.play();
      return;
    }

    player.pause();
    void player.seekTo(0);
  }, [autoPlay, player, status.isLoaded, track.uri]);

  useEffect(() => {
    if (!status.isLoaded) return;

    onPlayStateChange?.(status.playing);
    onProgress?.(status.currentTime, status.duration ?? 0);
  }, [
    onPlayStateChange,
    onProgress,
    status.currentTime,
    status.duration,
    status.isLoaded,
    status.playing,
  ]);

  useEffect(() => {
    if (!status.isLoaded) return;

    onRegisterControls?.({
      pause: () => player.pause(),
      resume: () => player.play(),
    });

    return () => {
      onRegisterControls?.(undefined);
      player.pause();
    };
  }, [onRegisterControls, player, status.isLoaded]);

  const togglePlay = () => {
    if (!status.isLoaded) return;

    if (status.playing) {
      player.pause();
      return;
    }

    player.play();
  };

  const seekBySeconds = (delta: number) => {
    if (!status.isLoaded) return;

    const duration = Math.max(0, status.duration ?? 0);
    const currentTime = Math.max(0, status.currentTime ?? 0);
    const nextTime = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, currentTime + delta));

    void player.seekTo(nextTime);
  };

  const { progress, positionLabel, durationLabel, isPlaying } = useMemo(() => {
    if (!status.isLoaded) {
      return {
        progress: 0,
        positionLabel: '0:00',
        durationLabel: track.duration ?? '--:--',
        isPlaying: false,
      };
    }

    const position = Math.max(0, Math.round((status.currentTime ?? 0) * 1000));
    const duration = Math.max(0, Math.round((status.duration ?? 0) * 1000));
    const safeDuration = duration > 0 ? duration : 1;
    const progressValue = Math.min(1, position / safeDuration);

    return {
      progress: progressValue,
      positionLabel: formatMillis(position),
      durationLabel: duration ? formatMillis(duration) : track.duration ?? '--:--',
      isPlaying: status.playing,
    };
  }, [
    status.currentTime,
    status.duration,
    status.isLoaded,
    status.playing,
    track.duration,
  ]);

  const artworkSize = isCompact ? 196 : 252;
  const artworkUrl = track.imageUrl || DEFAULT_CONTENT_IMAGE_URI;

  return (
    <LinearGradient
      colors={playerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: cardRadius,
        paddingHorizontal: isCompact ? theme.spacing.lg : theme.spacing.xl,
        paddingVertical: isCompact ? theme.spacing.xl : theme.spacing.xxl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: 'rgba(183,148,246,0.20)',
          pointerEvents: 'none',
        }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: -100,
          left: -90,
          width: 240,
          height: 240,
          borderRadius: 240,
          pointerEvents: 'none',
          backgroundColor: 'rgba(255,255,255,0.06)',
        }}
      />

      <View style={{ gap: isCompact ? 22 : 26 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PillMeta label="Music" />
            <PillMeta label={isPlaying ? 'Playing' : 'Paused'} />
          </View>

          {onClose ? (
            <TVTouchable
              onPress={onClose}
              style={{
                minHeight: 36,
                paddingHorizontal: 14,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              showFocusBorder={false}
            >
              <CustomText variant="caption" style={{ color: '#FFFFFF' }}>
                Close
              </CustomText>
            </TVTouchable>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: 18 }}>
          <View
            style={{
              width: artworkSize,
              height: artworkSize,
              borderRadius: isCompact ? 28 : 34,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              shadowColor: '#000',
              shadowOpacity: 0.44,
              shadowRadius: 34,
              shadowOffset: { width: 0, height: 22 },
              elevation: 16,
            }}
          >
            <Image
              source={{ uri: artworkUrl }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          <View style={{ width: '100%', gap: 7, alignItems: 'center' }}>
            <CustomText
              variant="hero"
              style={{
                color: '#FFFFFF',
                textAlign: 'center',
                maxWidth: 360,
              }}
              numberOfLines={2}
            >
              {track.title}
            </CustomText>

            <CustomText
              variant="subtitle"
              style={{
                color: 'rgba(255,255,255,0.70)',
                textAlign: 'center',
                maxWidth: 320,
              }}
              numberOfLines={2}
            >
              {track.artist || 'ClaudyGod'}
            </CustomText>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: 8,
                borderRadius: 999,
                backgroundColor: theme.colors.primary,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.62)' }}>
              {positionLabel}
            </CustomText>

            <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.62)' }}>
              {durationLabel}
            </CustomText>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCompact ? 10 : 14,
          }}
        >
          {onPrevious ? (
            <PlayerControlButton
              icon="skip-previous"
              onPress={onPrevious}
              disabled={!canGoPrevious}
            />
          ) : null}

          <PlayerControlButton icon="replay-10" onPress={() => seekBySeconds(-10)} />

          <TVTouchable
            onPress={togglePlay}
            style={{
              width: isCompact ? 78 : 88,
              height: isCompact ? 78 : 88,
              borderRadius: isCompact ? 39 : 44,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...(glowShadow as object),
            }}
            showFocusBorder={false}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={isCompact ? 34 : 40}
              color={theme.colors.textInverse}
            />
          </TVTouchable>

          <PlayerControlButton icon="forward-10" onPress={() => seekBySeconds(10)} />

          {onNext ? (
            <PlayerControlButton
              icon="skip-next"
              onPress={onNext}
              disabled={!canGoNext}
            />
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

function PlayerControlButton({
  icon,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.42 : 1,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons
        name={icon}
        size={22}
        color={theme.scheme === 'dark' ? '#FFFFFF' : theme.colors.text}
      />
    </TVTouchable>
  );
}

function PillMeta({ label }: { label: string }) {
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <CustomText
        variant="caption"
        style={{ color: 'rgba(255,255,255,0.72)', letterSpacing: 0.22 }}
      >
        {label}
      </CustomText>
    </View>
  );
}

function formatMillis(value: number) {
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${formatTwoDigits(seconds)}`;
}

function formatTwoDigits(value: number) {
  return value < 10 ? `0${value}` : `${value}`;
}