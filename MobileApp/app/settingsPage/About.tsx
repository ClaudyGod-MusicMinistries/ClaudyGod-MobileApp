/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/settingsPage/About.tsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
  Animated
} from "react-native";
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function About() {
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

  const teamMembers = [
    {
      name: 'Claudy God',
      role: 'Founder & Lead Artist',
      description: 'Worship leader and music creator passionate about spreading gospel music worldwide.'
    },
    {
      name: 'Development Team',
      role: 'Mobile App Development',
      description: 'Dedicated team of developers creating the best music streaming experience.'
    },
    {
      name: 'Music Team',
      role: 'Content & Curation',
      description: 'Curating the best worship and gospel music from around the world.'
    }
  ];

  const appFeatures = [
    '50+ million songs and growing',
    'High quality audio streaming',
    'Offline listening',
    'Personalized recommendations',
    'Create and share playlists',
    'Cross-platform sync',
    'Ad-free experience (Premium)',
    'Family sharing options'
  ];

  const socialLinks = [
    {
      icon: 'facebook',
      name: 'Facebook',
      url: 'https://facebook.com/claudygodmusic'
    },
    {
      icon: 'instagram',
      name: 'Instagram',
      url: 'https://instagram.com/claudygodmusic'
    },
    {
      icon: 'twitter',
      name: 'Twitter',
      url: 'https://twitter.com/claudygodmusic'
    },
    {
      icon: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com/claudygodmusic'
    }
  ];

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
              About
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
              }}
            >
              Learn more about ClaudyGod Music
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

          {/* App Logo & Version */}
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
              className="w-20 h-20 rounded-2xl mb-4 items-center justify-center" 
              style={{ 
                backgroundColor: currentColors.primary,
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  })
                }]
              }}
            >
              <MaterialIcons name="music-note" size={40} color="white" />
            </Animated.View>
            <CustomText 
              className="font-bold mb-2"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 4,
              }}
            >
              ClaudyGod Music
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
              }}
            >
              Version 1.0.0
            </CustomText>
          </Animated.View>

          {/* Mission Statement */}
          <Animated.View 
            className="mb-8"
            style={{
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              }]
            }}
          >
            <CustomText 
              className="font-bold mb-3 text-center"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              Our Mission
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
                lineHeight: 24,
                textAlign: 'center',
              }}
            >
              To spread the message of hope and faith through music, providing a platform where worship and gospel music can inspire, uplift, and bring people closer to God.
            </CustomText>
          </Animated.View>

          {/* Features */}
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
              className="font-bold mb-4"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              App Features
            </CustomText>
            
            <View className="rounded-2xl p-4" style={{ backgroundColor: currentColors.surface }}>
              <View className="flex-row flex-wrap justify-between">
                {appFeatures.map((feature, index) => (
                  <Animated.View 
                    key={feature} 
                    className="w-1/2 mb-3 flex-row items-center"
                    style={{
                      transform: [{
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [index % 2 === 0 ? -50 : 50, 0],
                        })
                      }]
                    }}
                  >
                    <MaterialIcons 
                      name="check-circle" 
                      size={sizes.iconSize - 2} 
                      color={currentColors.primary} 
                    />
                    <CustomText 
                      className="ml-2 flex-1"
                      style={{ 
                        color: currentColors.text.primary,
                        fontSize: sizes.fontSize - 1,
                      }}
                    >
                      {feature}
                    </CustomText>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Team */}
          <Animated.View 
            className="mb-8"
            style={{
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }]
            }}
          >
            <CustomText 
              className="font-bold mb-4"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              Our Team
            </CustomText>
            
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: currentColors.surface }}>
              {teamMembers.map((member, index) => (
                <Animated.View 
                  key={member.name}
                  className={`p-4 ${index < teamMembers.length - 1 ? 'border-b' : ''}`}
                  style={{ 
                    borderBottomColor: currentColors.border,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (index + 1), 0],
                      })
                    }]
                  }}
                >
                  <CustomText 
                    className="font-semibold mb-1"
                    style={{ 
                      color: currentColors.text.primary,
                      fontSize: sizes.fontSize,
                    }}
                  >
                    {member.name}
                  </CustomText>
                  <CustomText 
                    className="mb-2"
                    style={{ 
                      color: currentColors.primary,
                      fontSize: sizes.fontSize - 1,
                    }}
                  >
                    {member.role}
                  </CustomText>
                  <CustomText 
                    style={{ 
                      color: currentColors.text.secondary,
                      fontSize: sizes.fontSize - 1,
                      lineHeight: 20,
                    }}
                  >
                    {member.description}
                  </CustomText>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Social Links */}
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
              className="font-bold mb-4"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              Connect With Us
            </CustomText>
            
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: currentColors.surface }}>
              {socialLinks.map((social, index) => (
                <AnimatedTouchable
                  key={social.name}
                  onPress={() => Linking.openURL(social.url)}
                  className={`flex-row items-center py-4 px-4 ${
                    index < socialLinks.length - 1 ? 'border-b' : ''
                  }`}
                  style={{ 
                    borderBottomColor: currentColors.border,
                    borderBottomWidth: index < socialLinks.length - 1 ? 1 : 0,
                    transform: [{
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50 * (index + 1), 0],
                      })
                    }]
                  }}
                >
                  <MaterialIcons 
                    name={social.icon as any} 
                    size={sizes.iconSize} 
                    color={currentColors.primary} 
                  />
                  <CustomText 
                    className="ml-4 flex-1"
                    style={{ 
                      color: currentColors.text.primary,
                      fontSize: sizes.fontSize,
                    }}
                  >
                    {social.name}
                  </CustomText>
                  <MaterialIcons 
                    name="open-in-new" 
                    size={sizes.iconSize - 2} 
                    color={currentColors.text.secondary} 
                  />
                </AnimatedTouchable>
              ))}
            </View>
          </Animated.View>

          {/* Legal Info */}
          <Animated.View 
            className="rounded-2xl p-4 mb-4" 
            style={{ 
              backgroundColor: currentColors.surface,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [70, 0],
                })
              }]
            }}
          >
            <CustomText 
              className="text-center mb-2"
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize - 1,
              }}
            >
              © 2024 ClaudyGod Music. All rights reserved.
            </CustomText>
            <View className="flex-row justify-center space-x-4">
              <TouchableOpacity onPress={() => router.push('/settingsPage/Privacy')}>
                <CustomText 
                  style={{ 
                    color: currentColors.primary,
                    fontSize: sizes.fontSize - 1,
                  }}
                >
                  Privacy Policy
                </CustomText>
              </TouchableOpacity>
              <CustomText style={{ color: currentColors.text.secondary }}>•</CustomText>
              <TouchableOpacity onPress={() => console.log('Terms of Service')}>
                <CustomText 
                  style={{ 
                    color: currentColors.primary,
                    fontSize: sizes.fontSize - 1,
                  }}
                >
                  Terms of Service
                </CustomText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Empty space at bottom */}
          <View className="h-20" />
        </Animated.View>
      </ScrollView>
    </View>
  );
}