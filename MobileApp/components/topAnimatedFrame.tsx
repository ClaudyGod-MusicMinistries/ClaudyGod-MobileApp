/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  useWindowDimensions, 
  Image, 
  TouchableOpacity, 
  Animated, 
  NativeScrollEvent, 
  NativeSyntheticEvent, 
  ScrollView 
} from 'react-native';
import { CustomText } from './CustomText';
import { LinearGradient } from 'expo-linear-gradient';
import { defaultSlides } from '../data/data';
import { useColorScheme } from 'react-native';
import { colors } from '../constants/color';

// Remove fixed dimensions, use responsive ones
const SLIDER_HEIGHT_RATIO = 0.4; // 40% of screen height
const CONTENT_PADDING_RATIO = 0.04; // 4% of screen width

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
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Responsive dimensions
  const SLIDER_HEIGHT = SCREEN_HEIGHT * SLIDER_HEIGHT_RATIO;
  const CONTENT_PADDING = SCREEN_WIDTH * CONTENT_PADDING_RATIO;

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

  // Responsive font sizes based on screen width
  const getResponsiveFontSize = () => {
    if (SCREEN_WIDTH < 375) { // Small phones
      return {
        title: 22,
        subtitle: 14,
        cta: 14,
      };
    } else if (SCREEN_WIDTH < 414) { // Medium phones
      return {
        title: 26,
        subtitle: 16,
        cta: 15,
      };
    } else { // Large phones
      return {
        title: 30,
        subtitle: 18,
        cta: 16,
      };
    }
  };

  const fontSize = getResponsiveFontSize();

  return (
    <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: 8 }}>
      <View 
        className="w-full overflow-hidden"
        style={{ 
          height: SLIDER_HEIGHT,
          backgroundColor: currentColors.background,
          borderRadius: 20,
          overflow: 'hidden'
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
            <View key={slide.id} style={{ width: SCREEN_WIDTH - (CONTENT_PADDING * 2) }} className="relative">
              {/* Background Image */}
              <Image 
                source={typeof slide.backgroundImage === 'string' ? { uri: slide.backgroundImage } : slide.backgroundImage}
                style={{ width: '100%', height: '100%' }}
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
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: SLIDER_HEIGHT * 0.4 }}
              />

              {/* Content */}
              <View className="absolute inset-0 px-6 justify-center">
                <View style={{ maxWidth: '80%' }}>
                  <CustomText 
                    style={{ 
                      fontSize: fontSize.title,
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      lineHeight: fontSize.title * 1.2
                    }} 
                    numberOfLines={3}
                  >
                    {slide.title}
                  </CustomText>

                  <CustomText 
                    style={{ 
                      fontSize: fontSize.subtitle,
                      color: '#E0B3FF',
                      marginTop: 8,
                      marginBottom: 16,
                      lineHeight: fontSize.subtitle * 1.3
                    }}
                    numberOfLines={2}
                  >
                    {slide.subtitle}
                  </CustomText>

                  {slide.ctaText && (
                    <TouchableOpacity 
                      style={{ 
                        backgroundColor: currentColors.primary,
                        paddingHorizontal: SCREEN_WIDTH * 0.06,
                        paddingVertical: SCREEN_HEIGHT * 0.015,
                        borderRadius: 16,
                        alignSelf: 'flex-start'
                      }}
                      activeOpacity={0.8}
                    >
                      <CustomText 
                        style={{ 
                          fontSize: fontSize.cta,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
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
        <View 
          style={{ 
            position: 'absolute', 
            bottom: SLIDER_HEIGHT * 0.06, 
            left: 0, 
            right: 0, 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: 12
          }}
        >
          {slides.map((_, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => goToSlide(index)} 
              style={{ padding: 4 }} 
              activeOpacity={0.7}
            >
              <Animated.View 
                style={{
                  height: 6,
                  borderRadius: 3,
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