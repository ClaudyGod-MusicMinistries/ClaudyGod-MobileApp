import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface SurfaceCardProps extends ViewProps {
  tone?: 'default' | 'subtle' | 'strong';
}

export function SurfaceCard({ tone = 'default', style, children, ...props }: SurfaceCardProps) {
  const theme = useAppTheme();
  const isStrong = tone === 'strong';
  const isSubtle = tone === 'subtle';
  const backgroundColor = isStrong
    ? theme.colors.elevated
    : isSubtle
      ? theme.colors.surfaceAlt
      : theme.colors.surface;

  return (
    <View
      {...props}
      style={[
        {
          borderRadius: isStrong ? theme.radius.xl : theme.radius.lg,
          overflow: 'hidden',
          backgroundColor,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
