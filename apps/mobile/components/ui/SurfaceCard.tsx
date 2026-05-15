import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../util/colorScheme';

interface SurfaceCardProps extends ViewProps {
  tone?: 'default' | 'subtle' | 'strong';
}

export function SurfaceCard({ tone = 'default', style, children, ...props }: SurfaceCardProps) {
  const theme = useAppTheme();
  const isStrong = tone === 'strong';
  const isSubtle = tone === 'subtle';
  const backgroundColor = isStrong ? theme.colors.elevated : isSubtle ? theme.colors.surfaceAlt : theme.colors.surface;
  const borderColor = isStrong ? theme.colors.borderStrong : theme.colors.border;
  const shadowStyle =
    Platform.OS === 'web'
      ? isStrong
        ? ({ boxShadow: '0px 10px 24px rgba(0,0,0,0.16)' } as object)
        : ({ boxShadow: '0px 6px 14px rgba(0,0,0,0.08)' } as object)
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
          borderWidth: 1,
          borderColor,
          ...(shadowStyle as object),
        },
        style,
      ]}
    >
      {isStrong ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.035)', 'rgba(255,255,255,0.00)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
        />
      ) : null}
      {children}
    </View>
  );
}
