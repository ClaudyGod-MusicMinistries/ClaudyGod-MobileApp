/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/settingsPage/RateApp.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
  Alert,
  Animated
} from "react-native";
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RateApp() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const starScale = useRef(new Animated.Value(0.8)).current;
  const thankYouScale = useRef(new Animated.Value(0)).current;

  // Responsive calculations
  const getResponsiveSizes = () => {
    if (SCREEN_WIDTH < 375) {
      return {
        containerPadding: 16,
        iconSize: 20,
        fontSize: 14,
        headerMargin: 8,
      };
    } else if (SCREEN_WIDTH < 414) {
      return {
        containerPadding: 20,
        iconSize: 22,
        fontSize: 15,
        headerMargin: 12,
      };
    } else {
      return {
        containerPadding: 24,
        iconSize: 24,
        fontSize: 16,
        headerMargin: 16,
      };
    }
  };

  const sizes = getResponsiveSizes();

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(starScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Thank you animation
  useEffect(() => {
    if (hasRated) {
      Animated.spring(thankYouScale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [hasRated]);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    
    // Bounce animation when selecting a rating
    Animated.sequence([
      Animated.timing(starScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(starScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      Alert.alert('Select Rating', 'Please select a rating before submitting.');
      return;
    }

    if (selectedRating >= 4) {
      // High rating - direct to app store
      Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID');
      Alert.alert(
        'Thank You!',
        'Thank you for your positive rating! Redirecting to app store...'
      );
    } else {
      // Low rating - show feedback form
      Alert.alert(
        'We Value Your Feedback',
        'We\'re sorry to hear that. Would you like to tell us how we can improve?',
        [
          {
            text: 'No Thanks',
            style: 'cancel'
          },
          {
            text: 'Give Feedback',
            onPress: () => router.push('/settingsPage/HelpSupport')
          }
        ]
      );
    }
    
    setHasRated(true);
  };

  const RatingStar = ({ filled, onPress, size = sizes.iconSize + 8 }: { filled: boolean; onPress: () => void; size?: number }) => (
    <Animated.View
      style={{
        transform: [{ scale: starScale }]
      }}
    >
      <TouchableOpacity onPress={onPress} className="mx-1">
        <MaterialIcons 
          name={filled ? "star" : "star-border"} 
          size={size} 
          color={filled ? "#FFD700" : currentColors.text.secondary} 
        />
      </TouchableOpacity>
    </Animated.View>
  );

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: sizes.containerPadding, 
        paddingTop: sizes.headerMargin + 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: currentColors.border
      }}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 mr-4"
          >
            <MaterialIcons 
              name="arrow-back" 
              size={sizes.iconSize} 
              color={currentColors.text.primary} 
            />
          </TouchableOpacity>
          <View>
            <CustomText 
              className="font-bold"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 6,
              }}
            >
              Rate App
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
              }}
            >
              Share your experience with us
            </CustomText>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 100,
        }}
      >
        <Animated.View 
          style={{
            paddingHorizontal: sizes.containerPadding,
            paddingTop: 24,
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          }}
        >

          {!hasRated ? (
            <>
              {/* Rating Section */}
              <Animated.View 
                className="items-center mb-8"
                style={{
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }]
                }}
              >
                <Animated.View 
                  className="w-24 h-24 rounded-full mb-6 items-center justify-center" 
                  style={{ 
                    backgroundColor: `${currentColors.primary}20`,
                    transform: [{
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      })
                    }]
                  }}
                >
                  <MaterialIcons name="star" size={40} color={currentColors.primary} />
                </Animated.View>
                
                <CustomText 
                  className="font-bold mb-3 text-center"
                  style={{ 
                    color: currentColors.text.primary,
                    fontSize: sizes.fontSize + 4,
                  }}
                >
                  How would you rate{'\n'}ClaudyGod Music?
                </CustomText>
                
                <CustomText 
                  className="text-center mb-6"
                  style={{ 
                    color: currentColors.text.secondary,
                    fontSize: sizes.fontSize,
                    lineHeight: 22,
                  }}
                >
                  Your feedback helps us improve and create a better experience for everyone.
                </CustomText>

                {/* Star Rating */}
                <Animated.View 
                  className="flex-row mb-6"
                  style={{
                    transform: [{ scale: starScale }]
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RatingStar
                      key={star}
                      filled={star <= selectedRating}
                      onPress={() => handleRatingSelect(star)}
                      size={sizes.iconSize + 12}
                    />
                  ))}
                </Animated.View>

                {/* Rating Labels */}
                <View className="flex-row justify-between w-full px-4 mb-8">
                  <CustomText 
                    style={{ 
                      color: currentColors.text.secondary,
                      fontSize: sizes.fontSize - 1,
                    }}
                  >
                    Poor
                  </CustomText>
                  <CustomText 
                    style={{ 
                      color: currentColors.text.secondary,
                      fontSize: sizes.fontSize - 1,
                    }}
                  >
                    Excellent
                  </CustomText>
                </View>

                {/* Submit Button */}
                <AnimatedTouchable
                  onPress={handleSubmitRating}
                  className="py-4 px-8 rounded-2xl"
                  style={{ 
                    backgroundColor: currentColors.primary,
                    opacity: selectedRating === 0 ? 0.6 : 1,
                    transform: [{
                      scale: selectedRating > 0 ? 
                        fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }) : 1
                    }]
                  }}
                  disabled={selectedRating === 0}
                >
                  <CustomText 
                    className="font-semibold"
                    style={{ 
                      color: 'white',
                      fontSize: sizes.fontSize,
                    }}
                  >
                    Submit Rating
                  </CustomText>
                </AnimatedTouchable>
              </Animated.View>

              {/* What to Expect */}
              <Animated.View 
                className="mb-8"
                style={{
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    })
                  }]
                }}
              >
                <CustomText 
                  className="font-bold mb-4 text-center"
                  style={{ 
                    color: currentColors.text.primary,
                    fontSize: sizes.fontSize + 2,
                  }}
                >
                  What happens next?
                </CustomText>
                
                <View className="rounded-2xl p-4" style={{ backgroundColor: currentColors.surface }}>
                  {[
                    {
                      icon: 'thumb-up',
                      title: 'High Rating (4-5 stars)',
                      description: 'You\'ll be directed to the app store to publish your review'
                    },
                    {
                      icon: 'feedback',
                      title: 'Lower Rating (1-3 stars)',
                      description: 'We\'ll ask for feedback to help us improve'
                    }
                  ].map((item, index) => (
                    <Animated.View 
                      key={item.title} 
                      className={`flex-row items-start mb-4 ${index === 0 ? 'mb-4' : ''}`}
                      style={{
                        transform: [{
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [30 * (index + 1), 0],
                          })
                        }]
                      }}
                    >
                      <MaterialIcons 
                        name={item.icon as any} 
                        size={sizes.iconSize} 
                        color={currentColors.primary} 
                        style={{ marginTop: 2 }}
                      />
                      <View className="ml-4 flex-1">
                        <CustomText 
                          className="font-semibold mb-1"
                          style={{ 
                            color: currentColors.text.primary,
                            fontSize: sizes.fontSize,
                          }}
                        >
                          {item.title}
                        </CustomText>
                        <CustomText 
                          style={{ 
                            color: currentColors.text.secondary,
                            fontSize: sizes.fontSize - 1,
                            lineHeight: 20,
                          }}
                        >
                          {item.description}
                        </CustomText>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            </>
          ) : (
            /* Thank You Message */
            <Animated.View 
              className="items-center justify-center py-12"
              style={{
                transform: [{
                  scale: thankYouScale
                }]
              }}
            >
              <Animated.View 
                className="w-24 h-24 rounded-full mb-6 items-center justify-center" 
                style={{ 
                  backgroundColor: `${currentColors.primary}20`,
                  transform: [{
                    rotate: thankYouScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }}
              >
                <MaterialIcons name="check-circle" size={40} color={currentColors.primary} />
              </Animated.View>
              
              <CustomText 
                className="font-bold mb-3 text-center"
                style={{ 
                  color: currentColors.text.primary,
                  fontSize: sizes.fontSize + 4,
                }}
              >
                Thank You!
              </CustomText>
              
              <CustomText 
                className="text-center mb-6"
                style={{ 
                  color: currentColors.text.secondary,
                  fontSize: sizes.fontSize,
                  lineHeight: 22,
                }}
              >
                {selectedRating >= 4 
                  ? 'Your rating means a lot to us! Thank you for supporting ClaudyGod Music.'
                  : 'Thank you for your honest feedback. We\'re constantly working to improve.'
                }
              </CustomText>

              <AnimatedTouchable
                onPress={() => router.back()}
                className="py-3 px-6 rounded-2xl mt-4"
                style={{ 
                  backgroundColor: currentColors.primary,
                  transform: [{
                    scale: thankYouScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }}
              >
                <CustomText 
                  className="font-semibold"
                  style={{ 
                    color: 'white',
                    fontSize: sizes.fontSize,
                  }}
                >
                  Back to Settings
                </CustomText>
              </AnimatedTouchable>
            </Animated.View>
          )}

          {/* Empty space at bottom */}
          <View className="h-20" />
        </Animated.View>
      </ScrollView>
    </View>
  );
}