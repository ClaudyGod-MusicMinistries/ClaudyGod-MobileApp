/* eslint-disable @typescript-eslint/no-unused-vars */
// components/layout/TabScreenWrapper.tsx
import React from 'react';
import { View, StatusBar } from 'react-native';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';

interface TabScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export const TabScreenWrapper: React.FC<TabScreenWrapperProps> = ({
  children,
  scrollable = true
}) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Remove AnimatedHeader from here since it's in the layout */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};