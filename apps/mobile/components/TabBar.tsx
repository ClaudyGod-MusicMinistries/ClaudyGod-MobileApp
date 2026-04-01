import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    barHeight: isTV ? 88 : isTablet ? 80 : compact ? 70 : 74,
    iconSize: isTV ? 24 : 20,
    paddingX: isTV ? 22 : isTablet ? 18 : 12,
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

  const barSurface = colorScheme === 'dark' ? 'rgba(11,10,18,0.98)' : 'rgba(255,255,255,0.98)';
  const barBorder = colorScheme === 'dark' ? 'rgba(150,128,241,0.22)' : palette.border;
  const barGlow = colorScheme === 'dark' ? 'rgba(141,99,255,0.25)' : 'rgba(124,58,237,0.18)';

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
        backgroundColor: 'transparent',
      }}
    >
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(22,18,32,0.98)', barSurface]
            : ['rgba(255,255,255,0.98)', 'rgba(246,243,255,0.98)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          height: sizes.barHeight,
          borderWidth: 1,
          borderColor: barBorder,
          paddingHorizontal: sizes.paddingX,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: isTablet || isTV ? 24 : 22,
          shadowColor: barGlow,
          shadowOpacity: 0.55,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
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
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused
                  ? colorScheme === 'dark'
                    ? 'rgba(141,99,255,0.2)'
                    : 'rgba(124,58,237,0.08)'
                  : 'transparent',
                borderWidth: 1,
                borderColor: focused ? barBorder : 'transparent',
                gap: compact ? 2 : 4,
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
                      : 'rgba(255,255,255,0.86)'
                    : 'transparent',
                }}
              >
                <MaterialIcons
                  name={config.icon}
                  size={sizes.iconSize}
                  color={focused ? palette.primary : palette.text.secondary}
                />
              </View>
              {!compact ? (
                <CustomText
                  variant="caption"
                  style={{
                    color: focused ? palette.text.primary : palette.text.secondary,
                    fontSize: 10,
                    letterSpacing: 0.06,
                  }}
                >
                  {config.label}
                </CustomText>
              ) : null}
              {focused ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 6,
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
      </LinearGradient>
    </View>
  );
};

export default TabBar;
