/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CustomText } from '../components/CustomText';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { spacing } from '../styles/designTokens';
import { TVTouchable } from './ui/TVTouchable';

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isTV = Platform.isTV;
  const compact = SCREEN_WIDTH < 380;
  const sizes = {
    containerHeight: isTV ? 90 : compact ? 70 : 74,
    centerButtonSize: isTV ? 70 : compact ? 56 : 60,
    centerIconSize: isTV ? 30 : compact ? 24 : 26,
    regularIconSize: isTV ? 24 : compact ? 19 : 21,
    fontSize: isTV ? 12 : compact ? 10 : 11,
    centerButtonOffset: isTV ? -24 : compact ? -18 : -20,
  };

  const tabConfig = {
    home: { icon: 'home' as const, label: 'Home' },
    search: { icon: 'search' as const, label: 'Search' },
    Settings: { icon: 'settings' as const, label: 'Settings' },
    Favourites: { icon: 'favorite' as const, label: 'Library' },
    PlaySection: { icon: 'music-note' as const, label: 'Play', isCenter: true },
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

        const onPress = () => navigation.navigate(route.name as never);

        if (config.isCenter) {
          return (
            <TVTouchable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: sizes.centerButtonOffset,
              }}
              activeOpacity={0.9}
              hasTVPreferredFocus={index === 2}
              showFocusBorder={false}
            >
              <View
                style={{
                  width: sizes.centerButtonSize,
                  height: sizes.centerButtonSize,
                  borderRadius: sizes.centerButtonSize / 2,
                  backgroundColor: currentColors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: isFocused ? 1 : 0,
                  borderColor: isFocused ? currentColors.accent : 'transparent',
                  shadowColor: currentColors.primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                }}
              >
                <MaterialIcons
                  name={config.icon}
                  size={sizes.centerIconSize}
                  color="#FFFFFF"
                />
              </View>
            </TVTouchable>
          );
        }

        return (
          <TVTouchable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
            activeOpacity={0.7}
            showFocusBorder={false}
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
          </TVTouchable>
        );
      })}
    </View>
  );
};

export default TabBar;
