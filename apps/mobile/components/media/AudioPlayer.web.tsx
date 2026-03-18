import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from '../ui/TVTouchable';
import type { AudioTrack } from './AudioPlayer';

interface AudioPlayerProps {
  track: AudioTrack;
  autoPlay?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

export function AudioPlayer({ track, autoPlay = true, onClose, compact }: AudioPlayerProps) {
  const theme = useAppTheme();

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
      {!compact ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            {track.title}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            {track.artist || 'Streaming audio'}
          </CustomText>
        </View>
      ) : null}

      {React.createElement('audio', {
        controls: true,
        src: track.uri,
        autoPlay,
        preload: 'metadata',
        style: {
          width: '100%',
          minHeight: 42,
          borderRadius: 12,
        },
      })}

      {onClose ? (
        <TVTouchable
          onPress={onClose}
          style={{ marginTop: theme.spacing.md, alignSelf: 'flex-start' }}
          showFocusBorder={false}
        >
          <CustomText variant="label" style={{ color: theme.colors.primary }}>
            Close player
          </CustomText>
        </TVTouchable>
      ) : null}
    </View>
  );
}
