// components/ui/FadeIn.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, ViewProps } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FadeInProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  duration?: number;
}

export function FadeIn({
  children,
  delay = 0,
  from = 8,
  duration = 300,
  style,
  ...props
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(from)).current;
  const useNativeAnimations = Platform.OS !== 'web';
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
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
    ]).start();
  }, [delay, duration, opacity, reduceMotion, translateY, useNativeAnimations]);

  return (
    <Animated.View
      {...props}
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
