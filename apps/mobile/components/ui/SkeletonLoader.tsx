// components/ui/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const theme = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
      }}
    >
      <SkeletonLoader width="40%" height={14} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <SkeletonLoader width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonHeroCard() {
  const theme = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        gap: 12,
      }}
    >
      <SkeletonLoader width="100%" height={240} borderRadius={0} />
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonLoader width="50%" height={16} />
        <SkeletonLoader width="100%" height={14} />
        <SkeletonLoader width="80%" height={14} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <SkeletonLoader width="45%" height={48} borderRadius={12} />
          <SkeletonLoader width="45%" height={48} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}
