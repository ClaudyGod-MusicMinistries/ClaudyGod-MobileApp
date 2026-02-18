// components/layout/Screen.tsx
import React from 'react';
import { View } from 'react-native';
import responsive from '../../util/responsive';
import { layout } from '../../styles/designTokens';

interface ScreenProps {
  children: React.ReactNode;
}

export function Screen({ children }: ScreenProps) {
  const paddingX = responsive.breakpoint({
    small: 14,
    medium: 18,
    large: 22,
    xlarge: 28,
  });

  return (
    <View style={{ paddingHorizontal: paddingX }}>
      <View style={{ width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' }}>
        {children}
      </View>
    </View>
  );
}

