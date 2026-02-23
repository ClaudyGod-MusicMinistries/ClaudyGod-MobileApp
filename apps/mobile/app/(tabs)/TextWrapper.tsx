// components/layout/TabScreenWrapper.tsx
import React from 'react';
import { View, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

export const TabScreenWrapper: React.FC<TabScreenWrapperProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={currentColors.background} />
      <LinearGradient
        colors={['rgba(154,107,255,0.08)', 'rgba(6,4,13,0)']}
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
          backgroundColor: 'rgba(17,18,23,0.08)',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </View>
  );
};
