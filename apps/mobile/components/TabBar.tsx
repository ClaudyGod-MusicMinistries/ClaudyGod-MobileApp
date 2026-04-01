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
    barHeight: isTV ? 78 : isTablet ? 70 : compact ? 62 : 66,
    iconSize: isTV ? 22 : 20,
    paddingX: isTV ? 18 : isTablet ? 14 : 8,
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

  const barSurface = colorScheme === 'dark' ? 'rgba(10,10,16,0.96)' : 'rgba(255,255,255,0.98)';
  const barBorder = colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(17,18,23,0.08)';

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
        backgroundColor: barSurface,
        borderTopWidth: 1,
        borderTopColor: barBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: colorScheme === 'dark' ? 0.35 : 0.12,
        shadowRadius: 12,
        elevation: 18,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          height: sizes.barHeight,
          backgroundColor: barSurface,
          paddingHorizontal: sizes.paddingX,
          paddingTop: 6,
          paddingBottom: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
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
                minHeight: 52,
                marginHorizontal: 2,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                gap: compact ? 1 : 3,
              }}
              focusStyle={{ transform: [{ scale: isTV ? 1.08 : 1.02 }] }}
              showFocusBorder={false}
            >
              <MaterialIcons
                name={config.icon}
                size={sizes.iconSize}
                color={focused ? palette.primary : palette.textSecondary}
              />
              {!compact ? (
                <CustomText
                  variant="caption"
                  style={{
                    color: focused ? palette.text : palette.textSecondary,
                    fontSize: 10.5,
                    letterSpacing: 0.08,
                  }}
                >
                  {config.label}
                </CustomText>
              ) : null}
              {focused ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    width: 16,
                    height: 2,
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
