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
}

export function AudioPlayer({ track, autoPlay = true, onClose, compact }: AudioPlayerProps) {
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
