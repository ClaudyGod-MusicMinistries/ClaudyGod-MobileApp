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

const FALLBACK_TAB_CONFIG = {
  home: { icon: 'home-filled' as const, label: 'Home' },
  player: { icon: 'graphic-eq' as const, label: 'Music' },
  videos: { icon: 'ondemand-video' as const, label: 'Videos' },
  live: { icon: 'live-tv' as const, label: 'Live' },
  library: { icon: 'library-music' as const, label: 'Library' },
};

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 380;
  const isTablet = width >= 768 && !isTV;
  const { config } = useMobileAppConfig();

  const barMaxWidth = isTV ? 1120 : isTablet ? 720 : width - 24;
  const barBottomInset = isTV ? 20 : Math.max(insets.bottom, 12);
  const configuredTabs = config?.navigation?.tabs ?? [];
  const visibleRoutes = state.routes.filter((route) => Boolean((FALLBACK_TAB_CONFIG as Record<string, unknown>)[route.name]));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: barBottomInset,
        paddingHorizontal: 12,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          minHeight: compact ? 68 : 74,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(56,42,84,0.14)',
          backgroundColor: colorScheme === 'dark' ? 'rgba(10,7,17,0.92)' : 'rgba(255,255,255,0.92)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: colorScheme === 'dark' ? 0.42 : 0.16,
          shadowRadius: 32,
          elevation: 22,
        }}
      >
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
              : ['rgba(255,255,255,0.96)', 'rgba(247,243,255,0.86)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: compact ? 6 : 8,
            paddingVertical: 8,
          }}
        >
          {visibleRoutes.map((route) => {
            const routeIndex = state.routes.findIndex((entry) => entry.key === route.key);
            const dynamic = configuredTabs.find((item) => item.id === route.name);
            const fallback = (FALLBACK_TAB_CONFIG as Record<string, { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }>)[route.name];
            const itemConfig = dynamic
              ? { icon: dynamic.icon as React.ComponentProps<typeof MaterialIcons>['name'], label: dynamic.label }
              : fallback;
            if (!itemConfig) return null;

            const focused = state.index === routeIndex;
            const activeBg = colorScheme === 'dark' ? 'rgba(183,148,246,0.16)' : 'rgba(124,58,237,0.10)';

            return (
              <TVTouchable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={itemConfig.label}
                accessibilityState={{ selected: focused }}
                hasTVPreferredFocus={routeIndex === 0}
                onPress={() => navigation.navigate(route.name as never)}
                style={{
                  flex: 1,
                  minHeight: compact ? 52 : 58,
                  marginHorizontal: 2,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? activeBg : 'transparent',
                  gap: compact ? 2 : 4,
                }}
                focusStyle={{ transform: [{ scale: isTV ? 1.06 : 1.01 }] }}
                showFocusBorder={false}
              >
                <MaterialIcons
                  name={itemConfig.icon}
                  size={focused ? 23 : 21}
                  color={focused ? palette.primary : palette.textTertiary ?? palette.textSecondary}
                />
                {!compact ? (
                  <CustomText
                    variant="caption"
                    style={{
                      color: focused ? palette.text : palette.textTertiary ?? palette.textSecondary,
                      fontSize: 10.5,
                      letterSpacing: 0.05,
                    }}
                    numberOfLines={1}
                  >
                    {itemConfig.label}
                  </CustomText>
                ) : null}
                {focused ? (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      width: 18,
                      height: 3,
                      borderRadius: 3,
                      backgroundColor: palette.primary,
                    }}
                  />
                ) : null}
              </TVTouchable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default TabBar;
