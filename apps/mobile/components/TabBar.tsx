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
    barHeight: isTV ? 92 : isTablet ? 84 : compact ? 74 : 78,
    iconSize: isTV ? 24 : 20,
    paddingX: isTV ? 18 : isTablet ? 16 : 14,
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
          borderColor: colorScheme === 'dark' ? 'rgba(150,128,241,0.22)' : palette.border,
          backgroundColor: colorScheme === 'dark' ? 'rgba(9,10,17,0.96)' : palette.surface,
          paddingHorizontal: sizes.paddingX,
          paddingTop: 10,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: isTablet || isTV ? 20 : 18,
          borderTopRightRadius: isTablet || isTV ? 20 : 18,
          shadowColor: '#000000',
          shadowOpacity: 0.34,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -10 },
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
                minHeight: 58,
                marginHorizontal: 3,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                  ? colorScheme === 'dark'
                    ? 'rgba(137,92,246,0.14)'
                    : palette.surfaceAlt
                  : 'transparent',
                borderWidth: 1,
                borderColor: focused
                  ? colorScheme === 'dark'
                    ? 'rgba(167,139,250,0.26)'
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
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused
                    ? colorScheme === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.66)'
                    : 'transparent',
                }}
              >
                <MaterialIcons
                  name={config.icon}
                  size={sizes.iconSize}
                  color={focused ? palette.primary : palette.text.secondary}
                />
              </View>
              <CustomText
                variant="caption"
                style={{
                  color: focused ? palette.text.primary : palette.text.secondary,
                  fontSize: 10,
                  letterSpacing: 0.14,
                  textTransform: 'uppercase',
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
