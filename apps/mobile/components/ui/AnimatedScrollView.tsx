// components/ui/AnimatedScrollView.tsx
/**
 * Animated Scroll View Component
 * Beautiful parallax scrolling with smooth animations
 */

import React, { useRef } from 'react';
import {
  Animated,
  ScrollView,
  ScrollViewProps,
} from 'react-native';

interface AnimatedScrollViewProps extends ScrollViewProps {
  parallaxFactor?: number;
  fadeEdges?: boolean;
  onScroll?: (_offset: number) => void;
}

export const AnimatedScrollView = React.forwardRef<
  ScrollView,
  AnimatedScrollViewProps
>(
  (
    {
      onScroll: onScrollProp,
      children,
      ...props
    },
    ref,
  ) => {
    const scrollOffset = useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
      {
        useNativeDriver: false,
        listener: (event: any) => {
          onScrollProp?.(event.nativeEvent.contentOffset.y);
        },
      },
    );

    const fadeOpacity = scrollOffset.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Animated.ScrollView
        ref={ref}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        opacity={fadeEdges ? fadeOpacity : 1}
        {...props}
      >
        {children}
      </Animated.ScrollView>
    );
  },
);

AnimatedScrollView.displayName = 'AnimatedScrollView';
