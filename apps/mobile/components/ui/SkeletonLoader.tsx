// components/ui/SkeletonLoader.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles } from '../../styles/makeStyles';
import { useAppTheme } from '../../util/colorScheme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const SHIMMER_DURATION = 1100;

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

// ─── Static styles (no theme) ─────────────────────────────────────────────────

const ss = StyleSheet.create({
  heroPad:     { padding: 16, gap: 12 },
  heroBtnsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
});

// ─── Theme styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  shimmerBg:  { backgroundColor: theme.colors.surface },
  card: {
    padding: 16, backgroundColor: theme.colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border,
    gap: 12, marginBottom: 12,
  },
  heroOuter:  { backgroundColor: theme.colors.surface, borderRadius: 16, overflow: 'hidden', gap: 12, marginBottom: 12 },
}));

// ─── SkeletonLoaderComponent ──────────────────────────────────────────────────

function SkeletonLoaderComponent({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  // A translating highlight reads as "loading" — a slow opacity dim reads as
  // "something is wrong". The sweep is sized off the shimmer's own measured
  // width so it works for both fixed-px and percentage widths.
  const sweepWidth = Math.max(measuredWidth * 0.7, 60);
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-sweepWidth, Math.max(measuredWidth, sweepWidth)],
  });
  const highlightColor = theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)';

  return (
    <View
      onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
      style={[styles.shimmerBg, { width, height, borderRadius, overflow: 'hidden' }, style]}
    >
      {measuredWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { width: sweepWidth, transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={['transparent', highlightColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <SkeletonLoaderComponent width="40%" height={14} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoaderComponent
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
        />
      ))}
    </View>
  );
}

// ─── SkeletonAvatar ───────────────────────────────────────────────────────────

function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <SkeletonLoaderComponent width={size} height={size} borderRadius={size / 2} />;
}

// ─── SkeletonHeroCard ─────────────────────────────────────────────────────────

function SkeletonHeroCard() {
  const styles = useStyles();
  return (
    <View style={styles.heroOuter}>
      <SkeletonLoaderComponent width="100%" height={240} borderRadius={0} />
      <View style={ss.heroPad}>
        <SkeletonLoaderComponent width="50%" height={16} />
        <SkeletonLoaderComponent width="100%" height={14} />
        <SkeletonLoaderComponent width="80%" height={14} />
        <View style={ss.heroBtnsRow}>
          <SkeletonLoaderComponent width="45%" height={48} borderRadius={12} />
          <SkeletonLoaderComponent width="45%" height={48} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

// Attach subcomponents as static properties
SkeletonLoaderComponent.Card     = SkeletonCard;
SkeletonLoaderComponent.Avatar   = SkeletonAvatar;
SkeletonLoaderComponent.HeroCard = SkeletonHeroCard;

export const SkeletonLoader = SkeletonLoaderComponent;
