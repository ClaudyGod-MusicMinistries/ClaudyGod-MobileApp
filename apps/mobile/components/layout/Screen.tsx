// components/layout/Screen.tsx
import React from 'react';
import { Platform, StyleProp, View, ViewStyle, useWindowDimensions } from 'react-native';
import { layout } from '../../styles/designTokens';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, style, contentStyle }: ScreenProps) {
  const { width } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const isDesktop = width >= 1024 && !isTV;
  const isLargeDesktop = width >= 1440 && !isTV;

  const paddingX = isTV
    ? 56
    : isLargeDesktop
      ? 56
      : isDesktop
        ? 48
        : isTablet
          ? layout.tabletGutter
          : width >= 390
            ? layout.phoneGutter
            : layout.compactPhoneGutter;

  const maxContentWidth = isTV
    ? 1360
    : isLargeDesktop
      ? 1280
      : isDesktop
        ? 1180
        : isTablet
          ? 960
          : Math.min(540, width - paddingX * 2);

  return (
    <View style={[{ width: '100%', paddingHorizontal: paddingX }, style]}>
      <View
        style={[
          {
            width: '100%',
            maxWidth: maxContentWidth,
            alignSelf: 'center',
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
