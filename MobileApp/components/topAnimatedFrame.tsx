/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, Image, TouchableOpacity, Animated, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { CustomText } from './CustomText';
import { LinearGradient } from 'expo-linear-gradient';
import { defaultSlides } from '../data/data';
import { useColorScheme } from 'react-native';
import { colors } from '../constants/color';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_HEIGHT = 360;

export const TopAnimatedSection = ({
  slides = defaultSlides,
  autoPlay = true,
  interval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme || 'light'];

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };

  const goToSlide = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    }
    setCurrentIndex(index);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % slides.length;
    goToSlide(nextIndex);
  };

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


  const getDotOpacity = (index: number) => {
    return scrollX.interpolate({
      inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });
  };

  const getDotScale = (index: number) => {
    return scrollX.interpolate({
      inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });
  };

  const getDotWidth = (index: number) => {
    return scrollX.interpolate({
      inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      outputRange: [8, 20, 8],
      extrapolate: 'clamp',
    });
  };

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
      <View 
        className="w-full overflow-hidden"
        style={{ 
          height: SLIDER_HEIGHT,
          backgroundColor: currentColors.background,
          borderRadius: 20,
          overflow: 'hidden' // VERY IMPORTANT
        }}
      >
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
                source={typeof slide.backgroundImage === 'string' ? { uri: slide.backgroundImage } : slide.backgroundImage}
                className="w-full h-full"
                resizeMode="cover"
              />
              
              {/* Gradient overlays */}
              <LinearGradient
                colors={colorScheme === 'dark'
                  ? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)']
                  : ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']
                }
                style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '100%' }}
              />

              <LinearGradient
                colors={colorScheme === 'dark'
                  ? ['transparent','rgba(0,0,0,0.7)','rgba(0,0,0,0.9)']
                  : ['transparent','rgba(0,0,0,0.5)','rgba(0,0,0,0.8)']
                }
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
              />

              {/* Content */}
              <View className="absolute inset-0 px-6 justify-center">
                <View className="max-w-[80%]">
                  <CustomText variant="display" className="mb-3" style={{ color: '#FFFFFF' }} numberOfLines={3}>
                    {slide.title}
                  </CustomText>

                  <CustomText variant="caption" className="text-lg mb-4" style={{ color: '#E0B3FF' }}>
                    {slide.subtitle}
                  </CustomText>

                  {slide.ctaText && (
                    <TouchableOpacity 
                      style={{ backgroundColor: currentColors.primary }}
                      className="px-8 py-4 rounded-2xl self-start shadow-lg"
                      activeOpacity={0.8}
                    >
                      <CustomText variant="body" className="font-bold text-base" style={{ color: 'white' }}>
                        {slide.ctaText}
                      </CustomText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        {/* Indicator dots */}
        <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center space-x-3">
          {slides.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => goToSlide(index)} className="p-1" activeOpacity={0.7}>
              <Animated.View 
                className="h-1.5 rounded-full"
                style={{
                  opacity: getDotOpacity(index),
                  transform: [{ scale: getDotScale(index) }],
                  width: getDotWidth(index),
                  backgroundColor: index === currentIndex ? currentColors.primary : currentColors.text.secondary,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};
