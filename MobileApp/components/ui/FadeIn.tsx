// components/ui/FadeIn.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface FadeInProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
}

export function FadeIn({ children, delay = 0, from = 20, style, ...props }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      {...props}
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

