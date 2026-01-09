/* eslint-disable @typescript-eslint/no-require-imports */
// components/AnimatedHeader.tsx
import React from "react";
import {
  View,
  TouchableOpacity,
  Pressable,
  Image,
  StatusBar,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CustomText } from "./CustomText";
import { useColorScheme } from "../util/colorScheme";
import { colors } from "../constants/color";

interface AnimatedHeaderProps {
  onPressHome?: () => void;
  onPressNotifications?: () => void;
  onPressMenu?: () => void;
}

export const AnimatedHeader = ({
  onPressHome,
  onPressNotifications,
  onPressMenu,
}: AnimatedHeaderProps) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  // Get status bar height (approx 44 for iPhone, 56 for Android with notch, etc.)
  const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 28;
  
  const sizes = {
    containerHeight: 60 + STATUS_BAR_HEIGHT, // Header height + status bar area
    contentHeight: 60, // Actual header content height
    logoSize: 32,
    iconSize: 20,
    paddingHorizontal: 16,
    brandFontSize: 16,
    taglineFontSize: 12,
    separatorHeight: 24,
    iconButtonSize: 40,
  };

  return (
    <View 
      style={{
        backgroundColor: currentColors.background,
        borderBottomColor: currentColors.border,
        borderBottomWidth: 1,
        height: sizes.containerHeight,
        paddingTop: STATUS_BAR_HEIGHT, // Push content below status bar
      }}
    >
      {/* Header Content */}
      <View 
        style={{ 
          height: sizes.contentHeight,
          paddingHorizontal: sizes.paddingHorizontal,
        }}
        className="flex-row justify-between items-center"
      >
        
        {/* Logo + Brand */}
        <Pressable
          onPress={onPressHome}
          className="flex-row items-center flex-1"
        >
          <View className="flex-row items-center">
            <Image 
              source={require("../assets/images/ClaudyGoLogo.webp")}
              style={{ 
                width: sizes.logoSize, 
                height: sizes.logoSize,
                borderRadius: sizes.logoSize / 2,
              }}
              resizeMode="cover"
            />
            
            {/* Separator line */}
            <View 
              style={{ 
                height: sizes.separatorHeight,
                backgroundColor: currentColors.border,
              }}
              className="w-px mx-3"
            />
            
            <View className="flex-col">
              <CustomText 
                style={{ 
                  fontSize: sizes.brandFontSize,
                  color: currentColors.text.primary,
                  fontWeight: '500'
                }}
              >
                ClaudyGod
              </CustomText>
              <CustomText 
                style={{ 
                  fontSize: sizes.taglineFontSize,
                  color: currentColors.primary,
                }}
              >
                Music & Ministries
              </CustomText>
            </View>
          </View>
        </Pressable>

        {/* Right side icons */}
        <View className="flex-row items-center space-x-2">
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={onPressNotifications}
            style={{ 
              width: sizes.iconButtonSize, 
              height: sizes.iconButtonSize,
            }}
            className="justify-center items-center"
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="notifications"
              size={sizes.iconSize}
              color={currentColors.primary}
            />
          </TouchableOpacity>

          {/* 3-dot vertical menu icon */}
          <TouchableOpacity
            onPress={onPressMenu}
            style={{ 
              width: sizes.iconButtonSize, 
              height: sizes.iconButtonSize,
            }}
            className="justify-center items-center"
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="more-vert"
              size={sizes.iconSize}
              color={currentColors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AnimatedHeader;