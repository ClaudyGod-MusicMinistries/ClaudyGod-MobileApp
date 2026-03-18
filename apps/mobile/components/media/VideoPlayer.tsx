import React from 'react';
import { View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface VideoPlayerProps {
  title?: string;
  sourceUri: string;
  height?: number;
}

export function VideoPlayer({ title, sourceUri, height = 210 }: VideoPlayerProps) {
  const theme = useAppTheme();
  const player = useVideoPlayer(sourceUri, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.staysActiveInBackground = false;
  });

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
      <VideoView
        player={player}
        style={{ width: '100%', height }}
        nativeControls
        contentFit="cover"
        fullscreenOptions={{ enable: true }}
      />
      {title ? (
        <View style={{ padding: theme.spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            {title}
          </CustomText>
        </View>
      ) : null}
    </View>
  );
}
