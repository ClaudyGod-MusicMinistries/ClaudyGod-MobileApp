import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTrack = async () => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: autoPlay, progressUpdateIntervalMillis: 400 },
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((nextStatus) => {
        if (!isMounted) return;
        setStatus(nextStatus);
      });
    };

    loadTrack();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [autoPlay, track.uri]);

  const togglePlay = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const current = await sound.getStatusAsync();
    if (!current.isLoaded) return;
    if (current.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const { progress, positionLabel, durationLabel, isPlaying } = useMemo(() => {
    if (!status || !status.isLoaded) {
      return { progress: 0, positionLabel: '0:00', durationLabel: track.duration ?? '--:--', isPlaying: false };
    }
    const position = status.positionMillis ?? 0;
    const duration = status.durationMillis ?? 0;
    const safeDuration = duration > 0 ? duration : 1;
    const progressValue = Math.min(1, position / safeDuration);
    return {
      progress: progressValue,
      positionLabel: formatMillis(position),
      durationLabel: duration ? formatMillis(duration) : track.duration ?? '--:--',
      isPlaying: status.isPlaying,
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
        <TouchableOpacity
          onPress={togglePlay}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={24}
            color={theme.colors.text.inverse}
          />
        </TouchableOpacity>
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
        <TouchableOpacity onPress={onClose} style={{ marginTop: theme.spacing.md, alignSelf: 'flex-start' }}>
          <CustomText variant="label" style={{ color: theme.colors.primary }}>
            Close player
          </CustomText>
        </TouchableOpacity>
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
