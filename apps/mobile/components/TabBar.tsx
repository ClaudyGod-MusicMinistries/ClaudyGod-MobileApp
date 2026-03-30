import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { layout } from '../styles/designTokens';
import { useMobileAppConfig } from '../hooks/useMobileAppConfig';
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
  const { config } = useMobileAppConfig();

  const sizes = {
    barHeight: isTV ? 88 : isTablet ? 82 : compact ? 72 : 76,
    iconSize: isTV ? 24 : 20,
    paddingX: isTV ? 20 : isTablet ? 18 : 14,
  };

  const barMaxWidth = isTV ? 1240 : isTablet ? 880 : width;
  const barBottomInset = isTV ? 18 : Math.max(insets.bottom, 10);

  const fallbackTabConfig = {
    home: { icon: 'home-filled' as const, label: 'Home' },
    player: { icon: 'graphic-eq' as const, label: 'Music', isCenter: true },
    videos: { icon: 'ondemand-video' as const, label: 'Videos' },
    live: { icon: 'live-tv' as const, label: 'Live' },
    library: { icon: 'library-music' as const, label: 'Library' },
  };

  const configuredTabs = config?.navigation?.tabs ?? [];

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
          borderColor: colorScheme === 'dark' ? 'rgba(150,128,241,0.18)' : palette.border,
          backgroundColor: colorScheme === 'dark' ? 'rgba(8,8,14,0.96)' : 'rgba(255,255,255,0.96)',
          paddingHorizontal: sizes.paddingX,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: isTablet || isTV ? 22 : 20,
          shadowColor: '#000000',
          shadowOpacity: 0.28,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        {state.routes.map((route, index) => {
          const dynamic = configuredTabs.find((item) => item.id === route.name);
          const config = dynamic
            ? { icon: dynamic.icon as React.ComponentProps<typeof MaterialIcons>['name'], label: dynamic.label }
            : (fallbackTabConfig as any)[route.name];
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
                marginHorizontal: 3,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                  ? colorScheme === 'dark'
                    ? 'rgba(141,99,255,0.16)'
                    : palette.surfaceAlt
                  : 'transparent',
                borderWidth: 1,
                borderColor: focused
                  ? colorScheme === 'dark'
                    ? 'rgba(167,139,250,0.22)'
                    : palette.border
                  : 'transparent',
                gap: 4,
              }}
              focusStyle={{ transform: [{ scale: isTV ? 1.08 : 1.02 }] }}
              showFocusBorder={false}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused
                    ? colorScheme === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.66)'
                    : 'transparent',
                }}
              >
                <MaterialIcons
                  name={config.icon}
                  size={sizes.iconSize}
                  color={focused ? palette.primary : palette.textSecondary}
                />
              </View>
              <CustomText
                variant="caption"
                style={{
                  color: focused ? palette.text : palette.textSecondary,
                  fontSize: 10,
                  letterSpacing: 0.06,
                }}
              >
                {config.label}
              </CustomText>
              {focused ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 5,
                    width: 20,
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
