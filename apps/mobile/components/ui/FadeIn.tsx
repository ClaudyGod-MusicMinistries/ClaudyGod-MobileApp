// components/ui/FadeIn.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, ViewProps } from 'react-native';

interface FadeInProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  duration?: number;
}

export function FadeIn({
  children,
  delay = 0,
  from = 12,
  duration = 420,
  style,
  ...props
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(from)).current;
  const scale = useRef(new Animated.Value(0.985)).current;
  const useNativeAnimations = Platform.OS !== 'web';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNativeAnimations,
      }),
    ]).start();
  }, [delay, duration, opacity, scale, translateY, useNativeAnimations]);

  return (
    <Animated.View
      {...props}
      style={[{ opacity, transform: [{ translateY }, { scale }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
