// components/ui/FadeIn.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, ViewProps } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FadeInProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  duration?: number;
  /**
   * Changing this value replays the animation. Without it, FadeIn only ever
   * animates once at mount — for content gated behind a loading state (e.g.
   * `{loading || items.length > 0 ? <FadeIn>...` where the wrapper mounts
   * immediately to show a skeleton), that means the entrance plays against
   * the empty placeholder and the real content just pops in with no
   * transition once it arrives. Key this to something like a loading flag so
   * it replays exactly when real content replaces the placeholder.
   */
  replayKey?: string | number;
}

export function FadeIn({
  children,
  delay = 0,
  from = 8,
  duration = 300,
  replayKey,
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
    opacity.setValue(0);
    translateY.setValue(from);
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
  }, [delay, duration, from, opacity, reduceMotion, replayKey, translateY, useNativeAnimations]);

  return (
    <Animated.View
      {...props}
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
