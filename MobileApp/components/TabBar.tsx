/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { TVTouchable } from './ui/TVTouchable';

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme];
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const compact = width < 370;

  const sizes = {
    barHeight: isTV ? 90 : compact ? 70 : 74,
    buttonSize: isTV ? 48 : 42,
    iconSize: isTV ? 24 : 22,
    centerSize: isTV ? 62 : 54,
    paddingX: isTV ? 18 : 16,
  };

  const tabConfig = {
    home: { icon: 'home' as const, label: 'Home' },
    search: { icon: 'search' as const, label: 'Search' },
    PlaySection: { icon: 'music-note' as const, label: 'Player', isCenter: true },
    Favourites: { icon: 'favorite-border' as const, label: 'Library' },
    Settings: { icon: 'person-outline' as const, label: 'Profile' },
  };

  const getIconColor = (focused: boolean, isCenter?: boolean) => {
    if (isCenter) {
      return focused ? '#FFFFFF' : palette.text.secondary;
    }
    return focused ? '#FFFFFF' : palette.text.secondary;
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: sizes.barHeight,
        borderTopWidth: 1,
        borderTopColor: colorScheme === 'dark' ? '#252332' : '#DFDFE4',
        backgroundColor: colorScheme === 'dark' ? '#11111A' : '#F3F3F5',
        paddingHorizontal: sizes.paddingX,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {state.routes.map((route, index) => {
        const config = (tabConfig as any)[route.name];
        if (!config) return null;

        const focused = state.index === index;
        const isCenter = Boolean(config.isCenter);
        const baseSize = isCenter ? sizes.centerSize : sizes.buttonSize;
        const backgroundColor = focused
          ? '#111217'
          : colorScheme === 'dark'
          ? '#1A1924'
          : '#ECECF0';

        return (
          <TVTouchable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={config.label}
            hasTVPreferredFocus={index === 0}
            onPress={() => navigation.navigate(route.name as never)}
            style={{
              width: baseSize,
              height: baseSize,
              borderRadius: baseSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor,
              borderWidth: focused ? 0 : 1,
              borderColor: colorScheme === 'dark' ? '#2E2B3F' : '#DADBE2',
              marginTop: isCenter ? -12 : 0,
            }}
            focusStyle={{
              transform: [{ scale: isTV ? 1.1 : 1.04 }],
            }}
            showFocusBorder={false}
          >
            <MaterialIcons
              name={config.icon}
              size={isCenter ? sizes.iconSize + 2 : sizes.iconSize}
              color={getIconColor(focused, isCenter)}
            />
          </TVTouchable>
        );
      })}
    </View>
  );
};

export default TabBar;
