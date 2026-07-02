import React from 'react';
import { ImageBackground, StatusBar, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { getSidebarWidth } from '../../util/sidebarConfig';

const useStyles = makeStyles((theme) => ({
  root:       { flex: 1, backgroundColor: theme.colors.background },
  gradFlex:   { flex: 1 },
  safeArea:   { flex: 1, backgroundColor: 'transparent' as const },
}));

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
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isDark = theme.scheme === 'dark';
  const resolvedBackgroundHeight = isDesktop ? Math.max(backgroundHeight, 380) : backgroundHeight;
  const sidebarWidth = getSidebarWidth(width);

  const overlayColors: GradientColorStops =
    backgroundOverlayColors ??
    (isDark
      ? ['rgba(8,7,14,0.10)', 'rgba(8,7,14,0.66)', theme.colors.background]
      : ['rgba(76,29,149,0.08)', 'rgba(249,247,254,0.56)', theme.colors.background]);

  return (
    <View style={styles.root}>
      <StatusBar
        translucent={false}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          imageStyle={{ opacity: isDesktop ? 0.86 : 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: resolvedBackgroundHeight }}
        >
          <LinearGradient
            colors={overlayColors}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.82, y: 1 }}
            style={styles.gradFlex}
          />
        </ImageBackground>
      ) : null}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.gradFlex, { paddingLeft: sidebarWidth }]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
