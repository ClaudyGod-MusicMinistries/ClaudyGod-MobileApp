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

  const paddingX = isTV ? 48 : isTablet ? 30 : width >= 390 ? 18 : 14;
  const maxContentWidth = isTV ? 1280 : isTablet ? 960 : Math.min(540, width - paddingX * 2);

  return (
    <View style={[{ width: '100%', paddingHorizontal: paddingX }, style]}>
      <View
        style={[
          {
            width: '100%',
            maxWidth: Math.min(maxContentWidth, layout.maxContentWidth),
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
