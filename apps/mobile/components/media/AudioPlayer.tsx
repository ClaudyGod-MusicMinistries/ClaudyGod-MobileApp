import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from '../ui/TVTouchable';

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  uri: string;
  duration?: string;
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

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {!compact ? (
          <View style={{ flex: 1 }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
              {track.title}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
              {track.artist || 'Local file'}
            </CustomText>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onPrevious ? (
            <TVTouchable
              onPress={onPrevious}
              disabled={!canGoPrevious}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoPrevious ? 1 : 0.48,
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="skip-previous" size={20} color={theme.colors.text.primary} />
            </TVTouchable>
          ) : null}
          <TVTouchable
            onPress={togglePlay}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            showFocusBorder={false}
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={24}
              color={theme.colors.text.inverse}
            />
          </TVTouchable>
          {onNext ? (
            <TVTouchable
              onPress={onNext}
              disabled={!canGoNext}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoNext ? 1 : 0.48,
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="skip-next" size={20} color={theme.colors.text.primary} />
            </TVTouchable>
          ) : null}
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <View
          style={{
            height: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.muted,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: 4,
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
            {positionLabel}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
            {durationLabel}
          </CustomText>
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <TVTouchable
          onPress={() => seekBySeconds(-15)}
          style={{
            minWidth: 68,
            minHeight: 34,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceAlt,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          showFocusBorder={false}
        >
          <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
            -15s
          </CustomText>
        </TVTouchable>
        <TVTouchable
          onPress={() => seekBySeconds(15)}
          style={{
            minWidth: 68,
            minHeight: 34,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceAlt,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          showFocusBorder={false}
        >
          <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
            +15s
          </CustomText>
        </TVTouchable>
      </View>

      {onClose ? (
        <TVTouchable onPress={onClose} style={{ marginTop: theme.spacing.md, alignSelf: 'flex-start' }} showFocusBorder={false}>
          <CustomText variant="label" style={{ color: theme.colors.primary }}>
            Close player
          </CustomText>
        </TVTouchable>
      ) : null}
    </View>
  );
}

function formatMillis(value: number) {
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
