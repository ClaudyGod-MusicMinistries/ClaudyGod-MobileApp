import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface SurfaceCardProps extends ViewProps {
  tone?: 'default' | 'subtle' | 'strong';
}

export function SurfaceCard({ tone = 'default', style, children, ...props }: SurfaceCardProps) {
  const theme = useAppTheme();
  const baseBackground =
    tone === 'strong'
      ? theme.colors.surfaceAlt
      : tone === 'subtle'
      ? theme.colors.surfaceAlt
      : theme.colors.surface;

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: baseBackground,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.soft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
