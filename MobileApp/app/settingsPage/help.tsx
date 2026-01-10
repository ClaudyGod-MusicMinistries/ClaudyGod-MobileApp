/* eslint-disable @typescript-eslint/no-explicit-any */
// app/settingsPage/HelpSupport.tsx
import React, { useState, useEffect, useRef } from 'react';
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

export default function HelpSupport() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Animation for expanded sections
  const sectionAnimations = useRef<{[key: string]: Animated.Value}>({}).current;

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

  // Initialize section animations
  const faqSections = [
    {
      id: 'account',
      title: 'Account & Subscription',
      questions: [
        {
          question: 'How do I reset my password?',
          answer: 'You can reset your password by going to Settings > Account > Change Password. A reset link will be sent to your email.'
        },
        {
          question: 'How do I cancel my subscription?',
          answer: 'You can cancel your subscription at any time in Settings > Subscription. Your premium features will remain active until the end of your billing period.'
        },
        {
          question: 'Can I use one account on multiple devices?',
          answer: 'Yes! You can use your ClaudyGod Music account on up to 5 devices simultaneously with a Premium subscription.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      questions: [
        {
          question: 'The app keeps crashing. What should I do?',
          answer: 'Try closing and reopening the app. If the issue persists, go to Settings > About > Clear Cache. You can also try reinstalling the app.'
        },
        {
          question: 'Songs are not playing offline',
          answer: 'Make sure you have enough storage space and a stable internet connection when downloading. Check your download settings in Settings > Audio Quality.'
        },
        {
          question: 'Audio quality is poor',
          answer: 'Go to Settings > Audio Quality and select "High Quality" or "Very High Quality". Also check your internet connection for streaming.'
        }
      ]
    },
    {
      id: 'features',
      title: 'Features & Usage',
      questions: [
        {
          question: 'How do I create playlists?',
          answer: 'Tap the "+" button next to any song or go to Your Library > Playlists > Create Playlist. You can add songs by tapping the three dots next to any track.'
        },
        {
          question: 'Can I share my playlists with friends?',
          answer: 'Yes! Go to your playlist, tap the share icon, and choose how you want to share it. Your friends will need a ClaudyGod Music account to listen.'
        },
        {
          question: 'How does the recommendation system work?',
          answer: 'Our algorithm learns from your listening habits, favorite songs, and skipped tracks to suggest music you might enjoy.'
        }
      ]
    }
  ];

  // Initialize animations for each section
  faqSections.forEach(section => {
    if (!sectionAnimations[section.id]) {
      sectionAnimations[section.id] = new Animated.Value(0);
    }
  });

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

  const contactMethods = [
    {
      icon: 'email',
      title: 'Email Support',
      description: 'Get help via email',
      action: () => Linking.openURL('mailto:support@claudygodmusic.com?subject=Help & Support')
    },
    {
      icon: 'chat',
      title: 'Live Chat',
      description: '24/7 chat support',
      action: () => console.log('Open live chat')
    },
    {
      icon: 'phone',
      title: 'Call Support',
      description: '+1-800-CLAUDY-GOD',
      action: () => Linking.openURL('tel:+1800252839463')
    }
  ];

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      // Collapse section
      Animated.timing(sectionAnimations[sectionId], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setExpandedSection(null);
      });
    } else {
      // Expand section
      if (expandedSection) {
        // Collapse currently expanded section first
        Animated.timing(sectionAnimations[expandedSection], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setExpandedSection(sectionId);
          Animated.timing(sectionAnimations[sectionId], {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        });
      } else {
        setExpandedSection(sectionId);
        Animated.timing(sectionAnimations[sectionId], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    }
  };

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
              Help & Support
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
              }}
            >
              Get help and contact support
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

          {/* Contact Methods */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="mb-8"
          >
            <CustomText 
              className="font-bold mb-4"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              Contact Support
            </CustomText>
            
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: currentColors.surface }}>
              {contactMethods.map((method, index) => (
                <AnimatedTouchable
                  key={method.title}
                  onPress={method.action}
                  className={`flex-row items-center py-4 px-4 ${
                    index < contactMethods.length - 1 ? 'border-b' : ''
                  }`}
                  style={{ 
                    borderBottomColor: currentColors.border,
                    borderBottomWidth: index < contactMethods.length - 1 ? 1 : 0,
                    transform: [{
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50 * (index + 1), 0],
                      })
                    }]
                  }}
                >
                  <MaterialIcons 
                    name={method.icon as any} 
                    size={sizes.iconSize} 
                    color={currentColors.primary} 
                  />
                  <View className="ml-4 flex-1">
                    <CustomText 
                      className="font-semibold"
                      style={{ 
                        color: currentColors.text.primary,
                        fontSize: sizes.fontSize,
                      }}
                    >
                      {method.title}
                    </CustomText>
                    <CustomText 
                      style={{ 
                        color: currentColors.text.secondary,
                        fontSize: sizes.fontSize - 1,
                      }}
                    >
                      {method.description}
                    </CustomText>
                  </View>
                  <MaterialIcons 
                    name="chevron-right" 
                    size={sizes.iconSize} 
                    color={currentColors.text.secondary} 
                  />
                </AnimatedTouchable>
              ))}
            </View>
          </Animated.View>

          {/* FAQ Sections */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="mb-8"
          >
            <CustomText 
              className="font-bold mb-4"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              Frequently Asked Questions
            </CustomText>

            {faqSections.map((section, sectionIndex) => (
              <Animated.View 
                key={section.id} 
                className="mb-4"
                style={{
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30 * (sectionIndex + 1), 0],
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleSection(section.id)}
                  className="flex-row items-center justify-between py-3"
                >
                  <CustomText 
                    className="font-semibold"
                    style={{ 
                      color: currentColors.text.primary,
                      fontSize: sizes.fontSize + 1,
                    }}
                  >
                    {section.title}
                  </CustomText>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: sectionAnimations[section.id]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['180deg', '0deg']
                        }) || '180deg'
                      }]
                    }}
                  >
                    <MaterialIcons 
                      name="expand-less" 
                      size={sizes.iconSize} 
                      color={currentColors.text.secondary} 
                    />
                  </Animated.View>
                </TouchableOpacity>

                <Animated.View 
                  style={{ 
                    backgroundColor: currentColors.surface,
                    opacity: sectionAnimations[section.id] || 0,
                    height: sectionAnimations[section.id]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, section.questions.length * 120] // Adjust based on content
                    }) || 0,
                    overflow: 'hidden',
                    borderRadius: 16,
                    marginTop: 8,
                  }}
                >
                  {section.questions.map((faq, index) => (
                    <Animated.View 
                      key={faq.question}
                      className={`p-4 ${index < section.questions.length - 1 ? 'border-b' : ''}`}
                      style={{ 
                        borderBottomColor: currentColors.border,
                        opacity: sectionAnimations[section.id] || 0,
                      }}
                    >
                      <CustomText 
                        className="font-semibold mb-2"
                        style={{ 
                          color: currentColors.text.primary,
                          fontSize: sizes.fontSize,
                        }}
                      >
                        {faq.question}
                      </CustomText>
                      <CustomText 
                        style={{ 
                          color: currentColors.text.secondary,
                          fontSize: sizes.fontSize - 1,
                          lineHeight: 20,
                        }}
                      >
                        {faq.answer}
                      </CustomText>
                    </Animated.View>
                  ))}
                </Animated.View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Quick Tips */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="mb-8"
          >
            <CustomText 
              className="font-bold mb-4"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 2,
              }}
            >
              Quick Tips
            </CustomText>
            
            <View className="rounded-2xl p-4" style={{ backgroundColor: currentColors.surface }}>
              {[
                'Make sure your app is updated to the latest version',
                'Clear cache regularly for better performance',
                'Use Wi-Fi for downloading large playlists',
                'Check your internet connection if streaming is unstable',
                'Restart the app if you encounter any issues'
              ].map((tip, index) => (
                <Animated.View 
                  key={index} 
                  className="flex-row items-start mb-2"
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
                    name="lightbulb" 
                    size={sizes.iconSize - 2} 
                    color={currentColors.primary} 
                    style={{ marginTop: 2 }}
                  />
                  <CustomText 
                    className="ml-2 flex-1"
                    style={{ 
                      color: currentColors.text.primary,
                      fontSize: sizes.fontSize,
                    }}
                  >
                    {tip}
                  </CustomText>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Empty space at bottom */}
          <View className="h-20" />
        </Animated.View>
      </ScrollView>
    </View>
  );
}