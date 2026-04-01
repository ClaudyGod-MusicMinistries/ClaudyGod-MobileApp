import React from 'react';
import { ImageBackground, type ImageSourcePropType, StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';

type GradientColorStops = readonly [string, string, ...string[]];

interface TabScreenWrapperProps {
  children: React.ReactNode;
  backgroundImage?: ImageSourcePropType;
  backgroundHeight?: number;
  backgroundOverlayColors?: GradientColorStops;
}

export function TabScreenWrapper({
  children,
  backgroundImage,
  backgroundHeight = 320,
  backgroundOverlayColors,
}: TabScreenWrapperProps) {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme] ?? colors.dark;
  const isDark = colorScheme === 'dark';
  const overlayColors: GradientColorStops =
    backgroundOverlayColors ??
    (isDark
      ? ['rgba(8,7,14,0.12)', 'rgba(8,7,14,0.62)', currentColors.background]
      : ['rgba(76,29,149,0.08)', 'rgba(249,247,254,0.56)', currentColors.background]);

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar
        translucent={false}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={currentColors.background}
      />
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: backgroundHeight,
          }}
        >
          <LinearGradient
            colors={overlayColors}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.82, y: 1 }}
            style={{ flex: 1 }}
          />
        </ImageBackground>
      ) : null}
      <LinearGradient
        colors={['rgba(141,99,255,0.14)', 'rgba(141,99,255,0)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          pointerEvents: 'none',
        }}
      />
      <LinearGradient
        colors={['rgba(110,81,209,0.1)', 'rgba(110,81,209,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 30,
          right: -70,
          width: 220,
          height: 220,
          borderRadius: 220,
          pointerEvents: 'none',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
