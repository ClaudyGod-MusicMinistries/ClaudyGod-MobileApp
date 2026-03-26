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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface AnimatedScrollViewProps extends Omit<ScrollViewProps, 'onScroll'> {
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
      fadeEdges: _fadeEdges,
      ...props
    },
    ref,
  ) => {
    const scrollOffset = useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
      {
        useNativeDriver: false,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          onScrollProp?.(event.nativeEvent.contentOffset.y);
        },
      },
    );

    return (
      <Animated.ScrollView
        ref={ref}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        {...props}
      >
        {children}
      </Animated.ScrollView>
    );
  },
);

AnimatedScrollView.displayName = 'AnimatedScrollView';
