/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(tabs)/Settings.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView,
  TouchableOpacity,
  Switch,
  useWindowDimensions,
  Modal,
  BackHandler,
  Animated
} from "react-native";
import { CustomText } from '../../components/CustomText';
import { useColorScheme, useColorSchemeToggle } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { useRouter } from 'expo-router';

// Define proper TypeScript interfaces
interface NavigationItem {
  icon: string;
  label: string;
  action: () => void;
  type?: never;
  value?: never;
  onValueChange?: never;
}

interface SwitchItem {
  icon: string;
  label: string;
  type: 'switch';
  value: boolean;
  onValueChange: (value: boolean) => void;
  action?: never;
}

type SettingsItem = NavigationItem | SwitchItem;

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function Settings() {
  const colorScheme = useColorScheme();
  const toggleColorScheme = useColorSchemeToggle();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();

  // Mock settings state
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  
  // Modal and animation states
  const [showExitModal, setShowExitModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Animation values
  const fillAnimation = useState(new Animated.Value(0))[0];
  const modalOpacity = useState(new Animated.Value(0))[0];
  const modalScale = useState(new Animated.Value(0.8))[0];

  // Responsive calculations
  const getResponsiveSizes = () => {
    if (SCREEN_WIDTH < 375) {
      return {
        containerPadding: 16,
        iconSize: 20,
        fontSize: 14,
        headerMargin: 8,
        sectionSpacing: 24,
      };
    } else if (SCREEN_WIDTH < 414) {
      return {
        containerPadding: 20,
        iconSize: 22,
        fontSize: 15,
        headerMargin: 12,
        sectionSpacing: 28,
      };
    } else {
      return {
        containerPadding: 24,
        iconSize: 24,
        fontSize: 16,
        headerMargin: 16,
        sectionSpacing: 32,
      };
    }
  };

  const sizes = getResponsiveSizes();

  const settingsSections: SettingsSection[] = [
    {
      title: "Account",
      items: [
        { 
          icon: "security", 
          label: "Privacy & Security", 
          action: () => router.push('/settingsPage/Privacy') 
        },
        { 
          icon: "volunteer-activism", 
          label: "Donate", 
          action: () => router.push('/settingsPage/Donate') 
        },
      ]
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: "notifications", 
          label: "Push Notifications", 
          type: "switch" as const,
          value: notifications,
          onValueChange: setNotifications
        },
        { 
          icon: "dark-mode", 
          label: "Dark Mode", 
          type: "switch" as const,
          value: colorScheme === 'dark',
          onValueChange: toggleColorScheme
        },
        { 
          icon: "play-arrow", 
          label: "Auto-play", 
          type: "switch" as const,
          value: autoPlay,
          onValueChange: setAutoPlay
        },
        { 
          icon: "hd", 
          label: "High Quality Audio", 
          type: "switch" as const,
          value: highQuality,
          onValueChange: setHighQuality
        },
      ]
    },
    {
      title: "Support",
      items: [
        { 
          icon: "help", 
          label: "Help & Support", 
          action: () => router.push('/settingsPage/help') 
        },
        { 
          icon: "info", 
          label: "About", 
          action: () => router.push('/settingsPage/About') 
        },
        { 
          icon: "rate-review", 
          label: "Rate App", 
          action: () => router.push('/settingsPage/Rate') 
        },
      ]
    }
  ];

  // Animate modal when it opens/closes
  useEffect(() => {
    if (showExitModal) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showExitModal]);

  const handleLogout = () => {
    setShowExitModal(true);
  };

  const handleExitApp = () => {
    BackHandler.exitApp();
  };

  const handleExitWithAnimation = () => {
    setIsExiting(true);
    
    Animated.timing(fillAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
    
    setTimeout(() => {
      handleExitApp();
    }, 1500);
  };

  const handleCancelExit = () => {
    fillAnimation.setValue(0);
    setIsExiting(false);
    
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowExitModal(false);
    });
  };

  const handleItemPress = (item: SettingsItem) => {
    if ('action' in item && item.action) {
      item.action();
    }
  };

  const fillWidth = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 100,
          paddingTop: sizes.headerMargin
        }}
      >
        {/* Header Section */}
        <View style={{ paddingHorizontal: sizes.containerPadding, marginTop: sizes.headerMargin }}>
          <View className="mb-8">
            <CustomText 
              className="font-bold"
              style={{ 
                color: currentColors.text.primary,
                fontSize: sizes.fontSize + 6,
                marginBottom: 8,
              }}
            >
              Settings
            </CustomText>
            <CustomText 
              style={{ 
                color: currentColors.text.secondary,
                fontSize: sizes.fontSize,
              }}
            >
              Manage your app preferences and account settings
            </CustomText>
          </View>

          {/* Settings Sections */}
          {settingsSections.map((section) => (
            <View key={section.title} className="mb-8">
              <CustomText 
                className="font-semibold mb-4"
                style={{ 
                  color: currentColors.text.primary,
                  fontSize: sizes.fontSize + 1,
                }}
              >
                {section.title}
              </CustomText>
              
              <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: currentColors.surface }}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => handleItemPress(item)}
                    disabled={item.type === 'switch'}
                    className={`flex-row items-center justify-between py-4 px-4 ${
                      itemIndex < section.items.length - 1 ? 'border-b' : ''
                    }`}
                    style={{ 
                      borderBottomColor: currentColors.border,
                      borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      <MaterialIcons 
                        name={item.icon as any} 
                        size={sizes.iconSize} 
                        color={currentColors.primary} 
                      />
                      <CustomText 
                        className="ml-4"
                        style={{ 
                          color: currentColors.text.primary,
                          fontSize: sizes.fontSize,
                        }}
                      >
                        {item.label}
                      </CustomText>
                    </View>

                    {item.type === "switch" ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ 
                          false: currentColors.border, 
                          true: currentColors.primary 
                        }}
                        thumbColor={item.value ? 'white' : '#f4f3f4'}
                      />
                    ) : (
                      <MaterialIcons 
                        name="chevron-right" 
                        size={sizes.iconSize} 
                        color={currentColors.text.secondary} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center py-4 rounded-2xl mt-4"
            style={{ backgroundColor: `${currentColors.primary}20` }}
          >
            <MaterialIcons 
              name="logout" 
              size={sizes.iconSize} 
              color={currentColors.primary} 
            />
            <CustomText 
              className="ml-3 font-semibold"
              style={{ 
                color: currentColors.primary,
                fontSize: sizes.fontSize,
              }}
            >
              Log Out
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center mt-8 mb-4">
          <CustomText 
            style={{ 
              color: currentColors.text.secondary,
              fontSize: sizes.fontSize - 2,
            }}
          >
            ClaudyGod Music v1.0.0
          </CustomText>
        </View>
      </ScrollView>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleCancelExit}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: sizes.containerPadding
        }}>
          <Animated.View style={{ 
            width: '100%',
            maxWidth: 400,
            backgroundColor: currentColors.background,
            borderRadius: 20,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            opacity: modalOpacity,
            transform: [{ scale: modalScale }],
          }}>
            {/* Modal Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4" 
                style={{ backgroundColor: `${currentColors.primary}20` }}>
                <MaterialIcons 
                  name="exit-to-app" 
                  size={32} 
                  color={currentColors.primary} 
                />
              </View>
              <CustomText 
                className="font-bold text-center mb-2"
                style={{ 
                  color: currentColors.text.primary,
                  fontSize: sizes.fontSize + 4,
                }}
              >
                {isExiting ? 'Closing App...' : 'Exit App'}
              </CustomText>
              <CustomText 
                className="text-center"
                style={{ 
                  color: currentColors.text.secondary,
                  fontSize: sizes.fontSize,
                  lineHeight: 22,
                }}
              >
                {isExiting 
                  ? 'Thank you for using ClaudyGod Music!'
                  : 'Are you sure you want to close the app?'
                }
              </CustomText>
            </View>

            {/* Buttons - Only show when not exiting */}
            {!isExiting && (
              <View className="flex-row" style={{ gap: 12 }}>
                {/* Exit Button - LEFT SIDE */}
                <TouchableOpacity
                  onPress={handleExitWithAnimation}
                  className="flex-1 py-4 rounded-2xl overflow-hidden"
                  style={{ 
                    backgroundColor: '#EF4444',
                  }}
                >
                  <Animated.View 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      backgroundColor: '#DC2626',
                      width: fillWidth,
                      borderRadius: 16,
                    }}
                  />
                  
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons 
                      name="exit-to-app" 
                      size={sizes.iconSize} 
                      color="white" 
                    />
                    <CustomText 
                      className="font-semibold ml-2"
                      style={{ 
                        color: 'white',
                        fontSize: sizes.fontSize,
                      }}
                    >
                      Exit
                    </CustomText>
                  </View>
                </TouchableOpacity>

                {/* Cancel Button - RIGHT SIDE */}
                <TouchableOpacity
                  onPress={handleCancelExit}
                  className="flex-1 py-4 rounded-2xl border"
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: currentColors.border,
                    borderWidth: 1,
                  }}
                >
                  <CustomText 
                    className="font-semibold text-center"
                    style={{ 
                      color: currentColors.text.primary,
                      fontSize: sizes.fontSize,
                    }}
                  >
                    Cancel
                  </CustomText>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading Animation when exiting */}
            {isExiting && (
              <View className="items-center justify-center py-4">
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderWidth: 2, 
                  borderColor: '#EF4444', 
                  borderTopColor: 'transparent',
                  borderRadius: 16,
                  marginBottom: 12,
                }} />
                <CustomText 
                  className="text-center"
                  style={{ 
                    color: currentColors.text.secondary,
                    fontSize: sizes.fontSize - 1,
                  }}
                >
                  Closing application...
                </CustomText>
              </View>
            )}

            {/* Additional Info */}
            {!isExiting && (
              <View className="mt-4 p-3 rounded-xl" 
                style={{ backgroundColor: `${currentColors.primary}10` }}>
                <View className="flex-row items-center">
                  <MaterialIcons 
                    name="info" 
                    size={sizes.iconSize - 2} 
                    color={currentColors.primary} 
                  />
                  <CustomText 
                    className="ml-2 flex-1"
                    style={{ 
                      color: currentColors.text.secondary,
                      fontSize: sizes.fontSize - 1,
                    }}
                  >
                    You can reopen the app anytime from your home screen.
                  </CustomText>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </TabScreenWrapper>
  );
}