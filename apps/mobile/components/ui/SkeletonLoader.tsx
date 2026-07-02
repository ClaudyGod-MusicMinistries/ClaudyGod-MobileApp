// components/ui/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(shimmer, { toValue: 0, duration: 1500, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.8] });

  return (
    <Animated.View
      style={[styles.shimmerBg, { width, height, borderRadius, opacity }, style]}
    />
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
