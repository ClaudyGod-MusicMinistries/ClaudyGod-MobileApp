import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { TVTouchable } from './ui/TVTouchable';

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 370;
  const isTablet = width >= 768 && !isTV;

  const sizes = {
    barHeight: isTV ? 92 : compact ? 72 : 76,
    buttonSize: isTV ? 50 : 42,
    iconSize: isTV ? 24 : 22,
    centerSize: isTV ? 64 : 54,
    paddingX: isTV ? 18 : isTablet ? 14 : 10,
  };

  const tabConfig = {
    home: { icon: 'home' as const, label: 'Home' },
    videos: { icon: 'ondemand-video' as const, label: 'Videos' },
    PlaySection: { icon: 'music-note' as const, label: 'Player', isCenter: true },
    Favourites: { icon: 'favorite-border' as const, label: 'Library' },
    Settings: { icon: 'person-outline' as const, label: 'Account' },
  };

  const maxWidth = isTV ? 1240 : isTablet ? 900 : width;
  const bottomInset = isTV ? 18 : Math.max(insets.bottom, 8);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: bottomInset,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth,
          height: sizes.barHeight,
          borderTopWidth: 1,
          borderTopColor: '#252332',
          backgroundColor: '#11111A',
          paddingHorizontal: sizes.paddingX,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: isTablet || isTV ? 18 : 0,
          borderTopRightRadius: isTablet || isTV ? 18 : 0,
        }}
      >
        {state.routes.map((route, index) => {
          const config = (tabConfig as any)[route.name];
          if (!config) return null;

          const focused = state.index === index;
          const isCenter = Boolean(config.isCenter);
          const baseSize = isCenter ? sizes.centerSize : sizes.buttonSize;
          const backgroundColor = isCenter
            ? palette.primary
            : focused
            ? 'rgba(154,107,255,0.2)'
            : '#1A1924';

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
                borderWidth: isCenter ? 1 : 0,
                borderColor: isCenter ? 'rgba(255,255,255,0.4)' : 'transparent',
                marginTop: isCenter ? -12 : 0,
              }}
              focusStyle={{ transform: [{ scale: isTV ? 1.1 : 1.04 }] }}
              showFocusBorder={false}
            >
              <MaterialIcons
                name={config.icon}
                size={isCenter ? sizes.iconSize + 2 : sizes.iconSize}
                color={isCenter || focused ? '#FFFFFF' : palette.text.secondary}
              />
            </TVTouchable>
          );
        })}
      </View>
    </View>
  );
};

export default TabBar;
