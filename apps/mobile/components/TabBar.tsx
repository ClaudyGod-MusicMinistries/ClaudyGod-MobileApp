import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { layout } from '../styles/designTokens';
import { TVTouchable } from './ui/TVTouchable';
import { CustomText } from './CustomText';

export const BOTTOM_TAB_CONTENT_SPACER = layout.tabBarContentPadding;

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 370;
  const isTablet = width >= 768 && !isTV;

  const sizes = {
    barHeight: isTV ? 86 : isTablet ? 80 : compact ? 72 : 76,
    iconSize: isTV ? 24 : 20,
    paddingX: isTV ? 18 : isTablet ? 16 : 14,
  };

  const barMaxWidth = isTV ? 1240 : isTablet ? 880 : width;
  const barBottomInset = isTV ? 18 : Math.max(insets.bottom, 10);

  const tabConfig = {
    home: { icon: 'home-filled' as const, label: 'Home' },
    videos: { icon: 'ondemand-video' as const, label: 'Videos' },
    player: { icon: 'play-arrow' as const, label: 'Player', isCenter: true },
    library: { icon: 'library-music' as const, label: 'Library' },
    search: { icon: 'search' as const, label: 'Search' },
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: barBottomInset,
        paddingHorizontal: isTablet || isTV ? 0 : 12,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          height: sizes.barHeight,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          paddingHorizontal: sizes.paddingX,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: isTablet || isTV ? 18 : 16,
          borderTopRightRadius: isTablet || isTV ? 18 : 16,
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const config = (tabConfig as any)[route.name];
          if (!config) return null;

          const focused = state.index === index;

          return (
            <TVTouchable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={config.label}
              hasTVPreferredFocus={index === 0}
              onPress={() => navigation.navigate(route.name as never)}
              style={{
                flex: 1,
                minHeight: 56,
                marginHorizontal: 2,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.surfaceAlt : 'transparent',
                borderWidth: 1,
                borderColor: focused ? palette.border : 'transparent',
              }}
              focusStyle={{ transform: [{ scale: isTV ? 1.08 : 1.02 }] }}
              showFocusBorder={false}
            >
              <MaterialIcons
                name={config.icon}
                size={sizes.iconSize}
                color={focused ? palette.primary : palette.text.secondary}
              />
              <CustomText
                variant="caption"
                style={{
                  marginTop: 3,
                  color: focused ? palette.text.primary : palette.text.secondary,
                  fontSize: 10,
                  letterSpacing: 0.18,
                  textTransform: 'uppercase',
                }}
              >
                {route.name === 'player' ? 'Music' : config.label}
              </CustomText>
              {focused ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    width: 18,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: palette.primary,
                  }}
                />
              ) : null}
            </TVTouchable>
          );
        })}
      </View>
    </View>
  );
};

export default TabBar;
