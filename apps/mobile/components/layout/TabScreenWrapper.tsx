import React from 'react';
import { StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

export function TabScreenWrapper({ children }: TabScreenWrapperProps) {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar
        translucent={false}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={currentColors.background}
      />
      <LinearGradient
        colors={['rgba(210,176,105,0.12)', 'rgba(210,176,105,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          pointerEvents: 'none',
        }}
      />
      <LinearGradient
        colors={['rgba(92,118,142,0.12)', 'rgba(92,118,142,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 40,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: 240,
          pointerEvents: 'none',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
