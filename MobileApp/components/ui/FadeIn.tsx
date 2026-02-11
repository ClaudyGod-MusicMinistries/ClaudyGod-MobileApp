// components/ui/FadeIn.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewProps } from 'react-native';

interface FadeInProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  duration?: number;
}

export function FadeIn({
  children,
  delay = 0,
  from = 16,
  duration = 420,
  style,
  ...props
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      {...props}
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
