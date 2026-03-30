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
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: AudioPlayerProps) {
  const theme = useAppTheme();
  const player = useAudioPlayer(track.uri, { updateInterval: 400 });
  const status = useAudioPlayerStatus(player);
  const isCompact = Boolean(compact);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
  }, []);

  useEffect(() => {
    if (!status.isLoaded) {
      return;
    }

    if (autoPlay) {
      player.play();
      return;
    }

    player.pause();
    void player.seekTo(0);
  }, [autoPlay, player, status.isLoaded, track.uri]);

  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

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

    const duration = Math.max(0, status.duration);
    const nextTime = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, status.currentTime + delta));
    void player.seekTo(nextTime);
  };

  const { progress, positionLabel, durationLabel, isPlaying } = useMemo(() => {
    if (!status.isLoaded) {
      return { progress: 0, positionLabel: '0:00', durationLabel: track.duration ?? '--:--', isPlaying: false };
    }
    const position = Math.max(0, Math.round(status.currentTime * 1000));
    const duration = Math.max(0, Math.round(status.duration * 1000));
    const safeDuration = duration > 0 ? duration : 1;
    const progressValue = Math.min(1, position / safeDuration);
    return {
      progress: progressValue,
      positionLabel: formatMillis(position),
      durationLabel: duration ? formatMillis(duration) : track.duration ?? '--:--',
      isPlaying: status.playing,
    };
  }, [status, track.duration]);

  const artworkSize = isCompact ? 144 : 212;
  const artworkUrl = track.imageUrl || DEFAULT_CONTENT_IMAGE_URI;

  return (
    <LinearGradient
      colors={
        theme.scheme === 'dark'
          ? ['rgba(18,13,31,0.98)', 'rgba(7,6,12,0.98)']
          : ['rgba(249,247,255,0.98)', 'rgba(238,234,248,0.98)']
      }
      style={{
        borderRadius: theme.radius.xl,
        padding: isCompact ? theme.spacing.lg : theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -26,
          left: -18,
          width: 170,
          height: 170,
          borderRadius: 170,
          backgroundColor: theme.scheme === 'dark' ? 'rgba(141,99,255,0.14)' : 'rgba(126,86,255,0.08)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -34,
          right: -24,
          width: 190,
          height: 190,
          borderRadius: 190,
          backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(126,86,255,0.05)',
        }}
      />

      <View style={{ gap: isCompact ? 18 : 22 }}>
        <View
          style={{
            flexDirection: isCompact ? 'column' : 'row',
            alignItems: isCompact ? 'center' : 'flex-start',
            justifyContent: 'space-between',
            gap: isCompact ? 18 : 22,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <PillMeta label="Music player" />
            <PillMeta label={isPlaying ? 'Playing' : 'Paused'} />
          </View>

          {onClose ? (
            <TVTouchable
              onPress={onClose}
              style={{
                minHeight: 34,
                paddingHorizontal: 12,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              showFocusBorder={false}
            >
              <CustomText variant="label" style={{ color: theme.colors.text }}>
                Close
              </CustomText>
            </TVTouchable>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: artworkSize,
              height: artworkSize,
              borderRadius: isCompact ? 20 : 22,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: theme.colors.surfaceAlt,
              ...theme.shadows.card,
            }}
          >
            <Image source={{ uri: artworkUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          </View>

          <View style={{ width: '100%', gap: 6, alignItems: 'center' }}>
            <CustomText
              variant="hero"
              style={{
                color: theme.colors.text,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {track.title}
            </CustomText>
            <CustomText
              variant="subtitle"
              style={{
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {track.artist || 'ClaudyGod Ministries'}
            </CustomText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <PillMeta label={durationLabel} />
              <PillMeta label="Connected queue" />
            </View>
          </View>
        </View>

        <View style={{ marginTop: isCompact ? 0 : 2 }}>
          <View
            style={{
              height: 5,
              borderRadius: 999,
              backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : theme.colors.muted,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: 5,
                backgroundColor: theme.colors.primary,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
              {positionLabel}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
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
            <TVTouchable
              onPress={onPrevious}
              disabled={!canGoPrevious}
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoPrevious ? 1 : 0.48,
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="skip-previous" size={22} color={theme.colors.text} />
            </TVTouchable>
          ) : null}

          <TVTouchable
            onPress={() => seekBySeconds(-10)}
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            showFocusBorder={false}
          >
            <MaterialIcons name="replay-10" size={22} color={theme.colors.text} />
          </TVTouchable>

          <TVTouchable
            onPress={togglePlay}
            style={{
              width: isCompact ? 74 : 84,
              height: isCompact ? 74 : 84,
              borderRadius: isCompact ? 22 : 24,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.card,
            }}
            showFocusBorder={false}
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={isCompact ? 32 : 38}
              color={theme.colors.textInverse}
            />
          </TVTouchable>

          <TVTouchable
            onPress={() => seekBySeconds(10)}
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            showFocusBorder={false}
          >
            <MaterialIcons name="forward-10" size={22} color={theme.colors.text} />
          </TVTouchable>

          {onNext ? (
            <TVTouchable
              onPress={onNext}
              disabled={!canGoNext}
              style={{
                width: 44,
                height: 44,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoNext ? 1 : 0.48,
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="skip-next" size={22} color={theme.colors.text} />
            </TVTouchable>
          ) : null}
        </View>

      </View>
    </LinearGradient>
  );
}

function PillMeta({ label }: { label: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
      }}
    >
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
        {label}
      </CustomText>
    </View>
  );
}

function formatMillis(value: number) {
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
