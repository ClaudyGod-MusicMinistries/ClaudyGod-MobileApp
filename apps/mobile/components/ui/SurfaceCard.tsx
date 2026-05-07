import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../util/colorScheme';

interface SurfaceCardProps extends ViewProps {
  tone?: 'default' | 'subtle' | 'strong';
}

type ExtendedThemeColors = {
  elevated?: string;
  borderStrong?: string;
};

export function SurfaceCard({
  tone = 'default',
  style,
  children,
  ...props
}: SurfaceCardProps) {
  const theme = useAppTheme();
  const themeColors = theme.colors as typeof theme.colors & ExtendedThemeColors;

  const isStrong = tone === 'strong';
  const isSubtle = tone === 'subtle';

  const backgroundColor = isStrong
    ? themeColors.elevated ?? theme.colors.surface
    : isSubtle
      ? theme.colors.surfaceAlt
      : theme.colors.surface;

  const borderColor = isStrong
    ? themeColors.borderStrong ?? theme.colors.border
    : theme.colors.border;

  const shadowStyle =
    Platform.OS === 'web'
      ? isStrong
        ? { boxShadow: '0px 24px 50px rgba(0,0,0,0.30)' }
        : { boxShadow: '0px 12px 28px rgba(0,0,0,0.16)' }
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
          colors={
            theme.scheme === 'dark'
              ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.00)']
              : ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.00)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
          }}
        />
      ) : null}

      {children}
    </View>
  );
}