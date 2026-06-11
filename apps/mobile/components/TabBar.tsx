import React, { useMemo } from 'react';
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

type TabRouteName = 'home' | 'player' | 'videos' | 'library' | 'settings';

type FooterItem = {
  routeName: TabRouteName;
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  center?: boolean;
};

const FOOTER_ORDER: TabRouteName[] = ['home', 'player', 'videos', 'library', 'settings'];

const FOOTER_CONFIG: Record<TabRouteName, Omit<FooterItem, 'routeName' | 'key'>> = {
  home:     { icon: 'home'              as const, label: 'Home' },
  player:   { icon: 'headphones'        as const, label: 'Music' },
  videos:   { icon: 'play-circle-filled' as const, label: 'Videos', center: true },
  library:  { icon: 'library-music'     as const, label: 'Library' },
  settings: { icon: 'tune'             as const, label: 'Settings' },
};

function routeExists(routes: BottomTabBarProps['state']['routes'], routeName: string) {
  return routes.some((route) => route.name === routeName);
}

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 390;
  const isTablet = width >= 768 && !isTV;
  const { config } = useMobileAppConfig();

  const isDesktopWide = width >= 1024 && !isTV;
  const barMaxWidth = isTV ? 1120 : isDesktopWide ? Math.min(960, width - 64) : isTablet ? 680 : width - 32;
  const barBottomInset = isTV ? 24 : Math.max(insets.bottom, 12);
  const currentRouteName = state.routes[state.index]?.name;

  const isDark = colorScheme === 'dark';

  const footerItems = useMemo(() => {
    const configuredTabs = config?.navigation?.tabs ?? [];
    return FOOTER_ORDER.map((routeName) => {
      const existing = state.routes.find((route) => route.name === routeName);
      const dynamic = configuredTabs.find((entry) => entry.id === routeName);
      const fallback = FOOTER_CONFIG[routeName];
      const shouldRender = Boolean(existing) || routeName === 'settings';
      if (!shouldRender) return null;

      return {
        routeName,
        key: existing?.key ?? `synthetic-${routeName}`,
        label: fallback.center ? fallback.label : (dynamic?.label ?? fallback.label),
        icon: fallback.center
          ? fallback.icon
          : ((dynamic?.icon as React.ComponentProps<typeof MaterialIcons>['name']) || fallback.icon),
        center: fallback.center,
      } satisfies FooterItem;
    }).filter(Boolean) as FooterItem[];
  }, [config, state.routes]);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: barBottomInset,
        paddingHorizontal: 16,
        alignItems: 'center',
        pointerEvents: 'box-none',
      }}
    >
      {/* Tab bar pill */}
      <View
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          borderRadius: 26,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(183,148,246,0.18)' : 'rgba(56,42,84,0.18)',
          backgroundColor: isDark ? 'rgba(8,5,14,0.98)' : 'rgba(10,6,18,0.98)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.46,
          shadowRadius: 32,
          elevation: 24,
        }}
      >
        {/* Subtle top-edge highlight */}
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            borderRadius: 26,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: compact ? 4 : 6,
            paddingVertical: compact ? 8 : 10,
          }}
        >
          {footerItems.map((item) => {
            const routeIndex = state.routes.findIndex((entry) => entry.name === item.routeName);
            const focused = currentRouteName === item.routeName;
            const canNavigate =
              routeExists(state.routes, item.routeName) || item.routeName === 'settings';

            if (item.center) {
              // ── Centre play button ───────────────────────────────────────
              return (
                <TVTouchable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: focused }}
                  hasTVPreferredFocus={routeIndex === 0}
                  onPress={() => {
                    if (canNavigate) navigation.navigate(item.routeName as never);
                  }}
                  style={{
                    flex: 1.1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: compact ? 3 : 4,
                    paddingVertical: 2,
                  }}
                  showFocusBorder={false}
                >
                  {/* Gradient pill button */}
                  <LinearGradient
                    colors={palette.gradient.primary as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: compact ? 46 : 52,
                      height: compact ? 46 : 52,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: palette.primary,
                      shadowOpacity: focused ? 0.48 : 0.28,
                      shadowRadius: focused ? 20 : 14,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 12,
                    }}
                  >
                    <MaterialIcons
                      name="play-arrow"
                      size={compact ? 26 : 29}
                      color={palette.textInverse}
                    />
                  </LinearGradient>

                  <CustomText
                    variant="caption"
                    style={{
                      color: focused ? '#F6F0FF' : palette.textMuted,
                      fontSize: compact ? 9 : 9.5,
                      lineHeight: 12,
                      letterSpacing: 0,
                      fontWeight: focused ? '700' : '400',
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </CustomText>

                  {/* Active dot indicator */}
                  <View
                    style={{
                      width: focused ? 14 : 4,
                      height: 3,
                      borderRadius: 999,
                      backgroundColor: focused ? '#F6F0FF' : 'transparent',
                      marginTop: 1,
                      opacity: focused ? 0.8 : 0,
                    }}
                  />
                </TVTouchable>
              );
            }

            // ── Regular tab item ────────────────────────────────────────────
            return (
              <TVTouchable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: focused }}
                hasTVPreferredFocus={routeIndex === 0}
                onPress={() => {
                  if (canNavigate) navigation.navigate(item.routeName as never);
                }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 4,
                  gap: compact ? 3 : 4,
                }}
                focusStyle={{ transform: [{ scale: isTV ? 1.06 : 1 }] }}
                showFocusBorder={false}
              >
                {/* Icon with active background pill */}
                <View
                  style={{
                    width: compact ? 36 : 40,
                    height: compact ? 28 : 30,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused
                      ? isDark
                        ? 'rgba(183,148,246,0.18)'
                        : 'rgba(124,58,237,0.14)'
                      : 'transparent',
                  }}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={focused ? (compact ? 21 : 23) : (compact ? 19 : 21)}
                    color={focused ? palette.primary : palette.textMuted}
                  />
                </View>

                {/* Label */}
                <CustomText
                  variant="caption"
                  style={{
                    color: focused ? '#F6F0FF' : palette.textMuted,
                    fontSize: compact ? 9 : 9.5,
                    lineHeight: 12,
                    letterSpacing: 0,
                    fontWeight: focused ? '700' : '400',
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </CustomText>

                {/* Active dot indicator */}
                <View
                  style={{
                    width: focused ? 14 : 4,
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: focused ? palette.primary : 'transparent',
                    marginTop: 1,
                    opacity: focused ? 0.9 : 0,
                  }}
                />
              </TVTouchable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default TabBar;