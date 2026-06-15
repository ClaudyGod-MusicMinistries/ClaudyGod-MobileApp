import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface SurfaceCardProps extends ViewProps {
  tone?: 'default' | 'subtle' | 'strong';
}

export function SurfaceCard({ tone = 'default', style, children, ...props }: SurfaceCardProps) {
  const theme = useAppTheme();
  const isStrong = tone === 'strong';
  const isSubtle = tone === 'subtle';
  const backgroundColor = isStrong ? theme.colors.elevated : isSubtle ? theme.colors.surfaceAlt : theme.colors.surface;
  const shadowStyle =
    Platform.OS === 'web'
      ? isStrong
        ? ({ boxShadow: '0px 8px 20px rgba(0,0,0,0.14)' } as object)
        : ({ boxShadow: '0px 4px 10px rgba(0,0,0,0.08)' } as object)
      : isStrong
        ? theme.shadows.card
        : theme.shadows.soft;

  return (
    <View
      {...props}
      style={[
        {
          borderRadius: isStrong ? theme.radius.xl : theme.radius.lg,
          overflow: 'hidden',
          backgroundColor,
          ...(shadowStyle as object),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
