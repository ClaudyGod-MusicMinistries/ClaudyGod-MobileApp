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
        colors={
          isDark
            ? ['rgba(190,148,74,0.08)', 'rgba(8,8,10,0)']
            : ['rgba(137,107,54,0.08)', 'rgba(244,241,250,0)']
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.95 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 280,
          pointerEvents: 'none',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 110,
          right: -90,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: isDark ? 'rgba(104,123,139,0.05)' : 'rgba(120,131,148,0.05)',
          pointerEvents: 'none',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
