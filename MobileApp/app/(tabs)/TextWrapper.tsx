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
            ? ['rgba(109,40,217,0.24)', 'rgba(6,4,13,0)']
            : ['rgba(109,40,217,0.14)', 'rgba(244,241,250,0)']
        }
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.7, y: 0.8 }}
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
          top: 90,
          right: -70,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: colorScheme === 'dark' ? 'rgba(192,132,252,0.1)' : 'rgba(124,58,237,0.1)',
        }}
      />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};
