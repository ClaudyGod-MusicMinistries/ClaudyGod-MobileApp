// components/layout/TopAnimatedSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, Image, TouchableOpacity, Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { CustomText } from './CustomText';
import { LinearGradient } from 'expo-linear-gradient';
import { defaultSlides } from '../data/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_HEIGHT = 360; // Increased from 320 to 360

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  ctaText?: string;
}

interface TopAnimatedSectionProps {
  slides?: Slide[];
  autoPlay?: boolean;
  interval?: number;
}

export const TopAnimatedSection: React.FC<TopAnimatedSectionProps> = ({
  slides = defaultSlides,
  autoPlay = true,
  interval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll event
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Handle scroll end
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };

  // Navigate to specific slide
  const goToSlide = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    }
    setCurrentIndex(index);
  };

  // Handle next slide
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % slides.length;
    goToSlide(nextIndex);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }

    autoPlayTimer.current = setInterval(() => {
      handleNext();
    }, interval);

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [currentIndex, autoPlay, interval, slides.length]);

  // Dot opacity animation
  const getDotOpacity = (index: number) => {
    return scrollX.interpolate({
      inputRange: [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });
  };

  // Dot scale animation
  const getDotScale = (index: number) => {
    return scrollX.interpolate({
      inputRange: [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });
  };

  // Dot width animation
  const getDotWidth = (index: number) => {
    return scrollX.interpolate({
      inputRange: [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      outputRange: [8, 20, 8],
      extrapolate: 'clamp',
    });
  };

  return (
    <View className="w-full bg-black overflow-hidden" style={{ height: SLIDER_HEIGHT }}>
      {/* ScrollView for horizontal sliding */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {slides.map((slide) => (
          <View key={slide.id} style={{ width: SCREEN_WIDTH }} className="relative">
            {/* Background Image */}
            <Image 
              source={typeof slide.backgroundImage === 'string' 
                ? { uri: slide.backgroundImage } 
                : slide.backgroundImage
              }
              className="w-full h-full"
              resizeMode="cover"
              onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
            />
            
            {/* Much Darker Linear Gradient Overlay for optimal text readability */}
            <LinearGradient
              colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)']}
              locations={[0, 0.4, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: '100%',
              }}
            />
            
            {/* Additional very dark overlay at bottom for dots visibility */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              locations={[0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 120,
              }}
            />
            
            {/* Content */}
            <View className="absolute inset-0 px-6 justify-center">
              <View className="max-w-[75%]">
                <CustomText 
                  variant="heading" 
                  className="text-white text-2xl 
                  mb-2 leading-tight"
                  numberOfLines={2}
                >
                  {slide.title}
                </CustomText>
                
                <CustomText 
                  variant="title" 
                  className="text-purple-400 
                  text-lg mb-2 "
                >
                  {slide.subtitle}
                </CustomText>
                
             

                {slide.ctaText && (
                  <TouchableOpacity 
                    className="bg-purple-600 px-8 py-4 rounded-2xl self-start shadow-lg shadow-purple-500/25"
                    activeOpacity={0.8}
                  >
                    <CustomText variant="body" className="text-white font-bold text-base">
                      {slide.ctaText}
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Navigation Arrows */}

      {/* Animated Dots Indicator */}
      <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center space-x-3">
        {slides.map((_, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => goToSlide(index)}
            className="p-1"
            activeOpacity={0.7}
          >
            <Animated.View 
              className="h-1.5 rounded-full bg-white"
              style={{
                opacity: getDotOpacity(index),
                transform: [{ scale: getDotScale(index) }],
                width: getDotWidth(index),
                backgroundColor: index === currentIndex ? '#E1306C' : 'rgba(255,255,255,0.5)',
              }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Bar */}
      <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800/50">
        <Animated.View 
          className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
          style={{
            width: scrollX.interpolate({
              inputRange: [0, (slides.length - 1) * SCREEN_WIDTH],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          }}
        />
      </View>
    </View>
  );
};