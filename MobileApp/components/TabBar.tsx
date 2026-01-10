/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { View, TouchableOpacity, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CustomText } from "../components/CustomText";
import { useColorScheme } from "../util/colorScheme";
import { colors } from "../constants/color";

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  
  // Responsive sizing based on screen width
  const getResponsiveSizes = () => {
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
        borderRadius: 24,
        borderWidth: 1,
        borderColor: currentColors.border,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = (tabConfig as any)[route.name];
        
        if (!config) return null;

        const onPress = () => navigation.navigate(route.name);

        // Center Play Button - Professional floating design
        if (config.isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                marginTop: sizes.centerButtonOffset,
              }}
              activeOpacity={0.9}
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
            style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 8,
            }}
            activeOpacity={0.7}
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