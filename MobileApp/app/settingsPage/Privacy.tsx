/* eslint-disable @typescript-eslint/no-unused-vars */
// app/privacy.tsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated
} from "react-native";
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Privacy() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
    ]).start();
  }, []);

  const privacySections = [
    {
      title: "Data Collection",
      content: "We collect minimal data necessary to provide you with the best music experience. This includes your listening history, favorite songs, and app preferences to personalize your experience."
    },
    {
      title: "Data Usage",
      content: "Your data is used solely to improve your experience within the app. We do not sell your personal information to third parties. Data is used for recommendations, personalized playlists, and app functionality."
    },
    {
      title: "Data Storage",
      content: "Your data is stored securely on encrypted servers. We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or destruction."
    },
    {
      title: "Third-Party Services",
      content: "We may use third-party services for analytics and crash reporting. These services are bound by strict data protection agreements and cannot use your data for their own purposes."
    },
    {
      title: "Your Rights",
      content: "You have the right to access, modify, or delete your personal data at any time. You can also export your data or request account deletion through the app settings."
    },
    {
      title: "Contact Us",
      content: "If you have any questions about our privacy practices, please contact us at privacy@claudygodmusic.com"
    }
  ];

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
              Privacy & Security
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
              }}
            >
              How we protect and use your data
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
          {/* Introduction */}
          <Animated.View 
            className="mb-8"
            style={{
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                })
              }]
            }}
          >
            <CustomText 
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize,
                lineHeight: 24,
              }}
            >
              At ClaudyGod Music, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our music streaming service.
            </CustomText>
          </Animated.View>

          {/* Privacy Sections */}
          {privacySections.map((section, index) => (
            <Animated.View 
              key={section.title} 
              className="mb-6"
              style={{
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30 * (index + 1), 0],
                  })
                }]
              }}
            >
              <CustomText 
                className="font-semibold mb-2"
                style={{ 
                  color: currentColors.text.primary,
                  fontSize: sizes.fontSize + 1,
                }}
              >
                {section.title}
              </CustomText>
              <CustomText 
                style={{ 
                  color: currentColors.text.secondary,
                  fontSize: sizes.fontSize,
                  lineHeight: 22,
                }}
              >
                {section.content}
              </CustomText>
            </Animated.View>
          ))}

          {/* Last Updated */}
          <Animated.View 
            className="mt-8 p-4 rounded-2xl" 
            style={{ 
              backgroundColor: currentColors.surface,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }]
            }}
          >
            <CustomText 
              className="font-semibold text-center"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize,
              }}
            >
              Last Updated: January 15, 2024
            </CustomText>
          </Animated.View>

          {/* Empty space at bottom */}
          <View className="h-20" />
        </Animated.View>
      </ScrollView>
    </View>
  );
}