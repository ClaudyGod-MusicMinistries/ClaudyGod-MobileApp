import React from 'react';
import { View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface VideoPlayerProps {
  title?: string;
  sourceUri: string;
  height?: number;
}

export function VideoPlayer({ title, sourceUri, height = 210 }: VideoPlayerProps) {
  const theme = useAppTheme();

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
      <Video
        source={{ uri: sourceUri }}
        style={{ width: '100%', height }}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
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
