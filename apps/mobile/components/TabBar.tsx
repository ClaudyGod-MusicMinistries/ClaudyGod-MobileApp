import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, View, useWindowDimensions } from 'react-native';
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
  home: { icon: 'home' as const, label: 'Home' },
  player: { icon: 'graphic-eq' as const, label: 'Music' },
  videos: { icon: 'play-arrow' as const, label: 'Play', center: true },
  library: { icon: 'library-music' as const, label: 'Library' },
  settings: { icon: 'settings' as const, label: 'Settings' },
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
  const playPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(playPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(playPulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playPulse]);

  const barMaxWidth = isTV ? 1120 : isTablet ? 720 : width - 22;
  const barBottomInset = isTV ? 20 : Math.max(insets.bottom, 10);
  const currentRouteName = state.routes[state.index]?.name;

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
        label: fallback.center ? fallback.label : dynamic?.label ?? fallback.label,
        icon: fallback.center ? fallback.icon : (dynamic?.icon as React.ComponentProps<typeof MaterialIcons>['name']) || fallback.icon,
        center: fallback.center,
      } satisfies FooterItem;
    }).filter(Boolean) as FooterItem[];
  }, [config, state.routes]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: barBottomInset,
        paddingHorizontal: 11,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          minHeight: compact ? 60 : 64,
          borderRadius: 28,
          overflow: 'visible',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(185,148,255,0.15)' : 'rgba(56,42,84,0.16)',
          backgroundColor: colorScheme === 'dark' ? 'rgba(6,4,11,0.96)' : 'rgba(10,7,17,0.96)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.42,
          shadowRadius: 28,
          elevation: 22,
        }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.055)', 'rgba(255,255,255,0.012)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26 }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: compact ? 8 : 10,
            paddingVertical: 7,
          }}
        >
          {footerItems.map((item) => {
            const routeIndex = state.routes.findIndex((entry) => entry.name === item.routeName);
            const focused = currentRouteName === item.routeName;
            const canNavigate = routeExists(state.routes, item.routeName) || item.routeName === 'settings';
            const labelColor = focused ? '#F6F0FF' : palette.textMuted;

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
                  flex: item.center ? 0.9 : 1,
                  minHeight: compact ? 46 : 50,
                  marginHorizontal: 1,
                  borderRadius: item.center ? 999 : 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: compact ? 2 : 3,
                  transform: item.center ? [{ translateY: -13 }] : undefined,
                }}
                focusStyle={{ transform: [{ scale: isTV ? 1.06 : 1.01 }] }}
                showFocusBorder={false}
              >
                {item.center ? (
                  <>
                    <View style={{ width: compact ? 56 : 60, height: compact ? 56 : 60, alignItems: 'center', justifyContent: 'center' }}>
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          width: compact ? 54 : 58,
                          height: compact ? 54 : 58,
                          borderRadius: 999,
                          backgroundColor: palette.primary,
                          opacity: playPulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.04] }),
                          transform: [{ scale: playPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.22] }) }],
                        }}
                      />
                      <LinearGradient
                        colors={palette.gradient.primary as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: compact ? 48 : 52,
                          height: compact ? 48 : 52,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 3,
                          borderColor: '#06040B',
                          shadowColor: palette.primary,
                          shadowOpacity: focused ? 0.34 : 0.22,
                          shadowRadius: focused ? 20 : 14,
                          shadowOffset: { width: 0, height: 9 },
                          elevation: 14,
                        }}
                      >
                        <MaterialIcons name="play-arrow" size={compact ? 25 : 28} color={palette.textInverse} />
                      </LinearGradient>
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        width: focused ? 30 : 26,
                        height: focused ? 30 : 26,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: focused ? 'rgba(185,148,255,0.16)' : 'transparent',
                      }}
                    >
                      <MaterialIcons name={item.icon} size={focused ? 20 : 19} color={focused ? palette.primary : palette.textMuted} />
                    </View>
                    {!compact ? (
                      <CustomText
                        variant="caption"
                        style={{
                          color: labelColor,
                          fontSize: 9.4,
                          lineHeight: 12,
                          letterSpacing: 0,
                        }}
                        numberOfLines={1}
                      >
                        {item.label}
                      </CustomText>
                    ) : null}
                  </>
                )}

                {item.center ? (
                  <CustomText
                    variant="caption"
                    style={{
                      color: focused ? '#F6F0FF' : palette.textMuted,
                      fontSize: compact ? 8.8 : 9.2,
                      lineHeight: 11,
                      marginTop: compact ? -7 : -8,
                      letterSpacing: 0,
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </CustomText>
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
