/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { View, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CustomText } from "../components/CustomText";
import { useColorScheme } from "../util/colorScheme";
import { colors } from "../constants/color";
import { spacing, radius, tv as tvTokens, shadows } from "../styles/designTokens";

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
        containerHeight: 88,
        centerButtonSize: 76,
        centerIconSize: 34,
        regularIconSize: 26,
        fontSize: 14,
        bottomMargin: 32,
        containerMargin: 32,
        centerButtonOffset: -36
      };
    }

    if (SCREEN_WIDTH < 375) {
      return {
        containerHeight: 60,
        centerButtonSize: 56,
        centerIconSize: 24,
        regularIconSize: 20,
        fontSize: 10,
        bottomMargin: 16,
        containerMargin: 12,
        centerButtonOffset: -28
      };
    } else if (SCREEN_WIDTH < 414) {
      return {
        containerHeight: 64,
        centerButtonSize: 60,
        centerIconSize: 26,
        regularIconSize: 22,
        fontSize: 11,
        bottomMargin: 20,
        containerMargin: 16,
        centerButtonOffset: -30
      };
    } else {
      return {
        containerHeight: 68,
        centerButtonSize: 64,
        centerIconSize: 28,
        regularIconSize: 24,
        fontSize: 12,
        bottomMargin: 24,
        containerMargin: 20,
        centerButtonOffset: -32
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
        left: sizes.containerMargin,
        right: sizes.containerMargin,
        bottom: sizes.bottomMargin,
        height: sizes.containerHeight,
        flexDirection: 'row',
        backgroundColor: currentColors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: currentColors.border,
        paddingHorizontal: spacing.sm,
        ...shadows.card,
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
          ...tvTokens.focusShadow,
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
                  shadowColor: currentColors.primary,
                  shadowOffset: {
                    width: 0,
                    height: 6,
                  },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 12,
                  borderWidth: 2,
                  borderColor: `${currentColors.primary}80`,
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
