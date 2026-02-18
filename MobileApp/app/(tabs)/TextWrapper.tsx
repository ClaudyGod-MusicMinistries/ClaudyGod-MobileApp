// components/layout/TabScreenWrapper.tsx
import React from 'react';
import { View, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

export const TabScreenWrapper: React.FC<TabScreenWrapperProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(255,255,255,0.03)', 'rgba(6,4,13,0)']
            : ['rgba(255,255,255,0.92)', 'rgba(244,241,250,0.25)']
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.95 }}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 280,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 110,
          right: -90,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(17,18,23,0.035)',
        }}
      />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};
