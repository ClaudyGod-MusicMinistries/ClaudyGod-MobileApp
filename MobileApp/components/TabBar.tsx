/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { View, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CustomText } from "../components/CustomText";
import { useColorScheme } from "../util/colorScheme";
import { colors } from "../constants/color";
import { spacing, tv as tvTokens } from "../styles/designTokens";

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isTV = Platform.isTV;
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  
  // Responsive sizing based on screen width
  const getResponsiveSizes = () => {
    // TV gets larger hit targets automatically
    if (isTV) {
      return {
        containerHeight: 84,
        centerButtonSize: 72,
        centerIconSize: 32,
        regularIconSize: 24,
        fontSize: 12,
        bottomMargin: 0,
        containerMargin: 0,
        centerButtonOffset: -24
      };
    }

    if (SCREEN_WIDTH < 375) {
      return {
        containerHeight: 64,
        centerButtonSize: 54,
        centerIconSize: 22,
        regularIconSize: 18,
        fontSize: 10,
        bottomMargin: 0,
        containerMargin: 0,
        centerButtonOffset: -20
      };
    } else if (SCREEN_WIDTH < 414) {
      return {
        containerHeight: 66,
        centerButtonSize: 56,
        centerIconSize: 24,
        regularIconSize: 20,
        fontSize: 11,
        bottomMargin: 0,
        containerMargin: 0,
        centerButtonOffset: -22
      };
    } else {
      return {
        containerHeight: 68,
        centerButtonSize: 58,
        centerIconSize: 26,
        regularIconSize: 22,
        fontSize: 12,
        bottomMargin: 0,
        containerMargin: 0,
        centerButtonOffset: -22
      };
    }
  };

  const sizes = getResponsiveSizes();

  const tabConfig = {
    home: { icon: "home" as const, label: "Home" },
    search: { icon: "search" as const, label: "Search" },
    Settings: { icon: "settings" as const, label: "Settings" },
    Favourites: { icon: "favorite" as const, label: "Library" },
    PlaySection: { icon: "play-arrow" as const, label: "Play", isCenter: true },
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: sizes.containerHeight,
        flexDirection: 'row',
        backgroundColor: currentColors.surface,
        borderRadius: 0,
        borderTopWidth: 1,
        borderTopColor: currentColors.border,
        paddingHorizontal: spacing.md,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = (tabConfig as any)[route.name];
        
        if (!config) return null;

        const onPress = () => navigation.navigate(route.name);

        // Center Play Button - Professional floating design
        const focusRingStyle = focusedKey === route.key ? {
          transform: [{ scale: tvTokens.focusScale }],
        } : null;

        if (config.isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onFocus={() => setFocusedKey(route.key)}
              style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                marginTop: sizes.centerButtonOffset,
                ...(focusRingStyle || {}),
              }}
              activeOpacity={0.9}
              focusable
              hasTVPreferredFocus={index === 2}
              hitSlop={tvTokens.hitSlop}
            >
              <View 
                style={{
                  width: sizes.centerButtonSize,
                  height: sizes.centerButtonSize,
                  borderRadius: sizes.centerButtonSize / 2,
                  backgroundColor: currentColors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: currentColors.primary,
                }}
              >
                <MaterialIcons 
                  name={config.icon} 
                  size={sizes.centerIconSize} 
                  color="#FFFFFF" 
                />
              </View>
            </TouchableOpacity>
          );
        }

        // Regular Tabs - Professional minimal design
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onFocus={() => setFocusedKey(route.key)}
            style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 8,
              ...(focusRingStyle || {}),
            }}
            activeOpacity={0.7}
            focusable
            hitSlop={tvTokens.hitSlop}
          >
            <View style={{ alignItems: 'center', gap: 4 }}>
              <MaterialIcons 
                name={config.icon} 
                size={sizes.regularIconSize}
                color={isFocused ? currentColors.primary : currentColors.text.secondary}
              />
              <CustomText
                style={{ 
                  fontSize: sizes.fontSize,
                  color: isFocused ? currentColors.primary : currentColors.text.secondary,
                  fontWeight: isFocused ? '600' : '400',
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                {config.label}
              </CustomText>
              
              {/* Active indicator dot */}
              {isFocused && (
                <View 
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: currentColors.primary,
                    marginTop: 2,
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TabBar;
