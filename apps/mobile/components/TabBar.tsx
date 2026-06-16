import React, { useMemo } from 'react';
import { Image, Platform, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { layout } from '../styles/designTokens';
import { useMobileAppConfig } from '../hooks/useMobileAppConfig';
import { getSidebarWidth } from '../util/sidebarConfig';
import { TVTouchable } from './ui/TVTouchable';
import { CustomText } from './CustomText';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';

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

const ICON_ACCENT: Partial<Record<TabRouteName, string>> = {
  videos: '#8B5CF6',
};

function routeExists(routes: BottomTabBarProps['state']['routes'], routeName: string) {
  return routes.some((route) => route.name === routeName);
}

// ─── Sidebar (desktop / TV) ───────────────────────────────────────────────────

function SidebarTabBar({
  state,
  navigation,
  footerItems,
  sidebarWidth,
  isDark,
  palette,
}: {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  footerItems: FooterItem[];
  sidebarWidth: number;
  isDark: boolean;
  palette: typeof colors.dark;
}) {
  const currentRouteName = state.routes[state.index]?.name;
  const insets = useSafeAreaInsets();
  const isTV = Platform.isTV;

  const mainItems = footerItems.filter((item) => item.routeName !== 'settings');
  const settingsItem = footerItems.find((item) => item.routeName === 'settings');

  const navigateTo = (item: FooterItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const canNavigate = routeExists(state.routes, item.routeName) || item.routeName === 'settings';
    if (canNavigate) navigation.navigate(item.routeName as never);
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: sidebarWidth,
        zIndex: 100,
        backgroundColor: isDark ? 'rgba(7,5,12,0.98)' : 'rgba(10,6,20,0.97)',
        borderRightWidth: 1,
        borderRightColor: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(56,42,84,0.14)',
        paddingTop: insets.top + (isTV ? 24 : 16),
        paddingBottom: insets.bottom + (isTV ? 24 : 16),
        paddingHorizontal: isTV ? 16 : 12,
        justifyContent: 'space-between',
      }}
    >

      <View style={{ gap: 0 }}>
        {/* Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginBottom: isTV ? 32 : 24 }}>
          <View
            style={{
              width: isTV ? 44 : 38,
              height: isTV ? 44 : 38,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: 'rgba(139,92,246,0.22)',
            }}
          >
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#FFFFFF', fontSize: isTV ? 16 : 14, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={1}>
              ClaudyGod
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: isTV ? 11 : 10, marginTop: 1 }} numberOfLines={1}>
              Worship & Ministry
            </Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={{ color: palette.textMuted, fontSize: 9.5, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', paddingHorizontal: 10, marginBottom: 8 }}>
          Navigate
        </Text>

        {/* Main nav items */}
        <View style={{ gap: 2 }}>
          {mainItems.map((item) => {
            const focused = currentRouteName === item.routeName;
            const accentColor = ICON_ACCENT[item.routeName] ?? palette.primary;
            return (
              <TVTouchable
                key={item.key}
                onPress={() => navigateTo(item)}
                showFocusBorder={false}
                focusStyle={{ transform: [{ scale: 1.02 }] }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: isTV ? 14 : 12,
                  paddingVertical: isTV ? 13 : 11,
                  paddingHorizontal: isTV ? 14 : 12,
                  borderRadius: 14,
                  backgroundColor: focused
                    ? isDark ? 'rgba(139,92,246,0.14)' : 'rgba(124,58,237,0.10)'
                    : 'transparent',
                  borderWidth: focused ? 1 : 0,
                  borderColor: focused ? 'rgba(139,92,246,0.24)' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: isTV ? 36 : 30,
                    height: isTV ? 36 : 30,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused
                      ? isDark ? 'rgba(139,92,246,0.20)' : 'rgba(124,58,237,0.14)'
                      : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  {item.center ? (
                    <View style={{ width: '100%', height: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary }}>
                      <MaterialIcons name="play-arrow" size={isTV ? 20 : 17} color="#FFFFFF" />
                    </View>
                  ) : (
                    <MaterialIcons
                      name={item.icon}
                      size={isTV ? 20 : 17}
                      color={focused ? accentColor : palette.textMuted}
                    />
                  )}
                </View>

                <Text
                  style={{
                    color: focused ? '#F7F2FF' : palette.textMuted,
                    fontSize: isTV ? 15 : 13.5,
                    fontWeight: focused ? '700' : '500',
                    flex: 1,
                  }}
                >
                  {item.label}
                </Text>

                {focused ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: palette.primary,
                    }}
                  />
                ) : null}
              </TVTouchable>
            );
          })}
        </View>
      </View>

      {/* Bottom: Settings */}
      {settingsItem ? (
        <View style={{ gap: 8 }}>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 8 }} />
          <TVTouchable
            key={settingsItem.key}
            onPress={() => navigateTo(settingsItem)}
            showFocusBorder={false}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: isTV ? 14 : 12,
              paddingVertical: isTV ? 12 : 10,
              paddingHorizontal: isTV ? 14 : 12,
              borderRadius: 14,
              backgroundColor: currentRouteName === 'settings'
                ? isDark ? 'rgba(139,92,246,0.12)' : 'rgba(124,58,237,0.08)'
                : 'transparent',
            }}
          >
            <View
              style={{
                width: isTV ? 36 : 30,
                height: isTV ? 36 : 30,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              }}
            >
              <MaterialIcons
                name="tune"
                size={isTV ? 18 : 16}
                color={currentRouteName === 'settings' ? palette.primary : palette.textMuted}
              />
            </View>
            <Text
              style={{
                color: currentRouteName === 'settings' ? '#F7F2FF' : palette.textMuted,
                fontSize: isTV ? 14 : 13,
                fontWeight: currentRouteName === 'settings' ? '700' : '500',
              }}
            >
              Settings
            </Text>
          </TVTouchable>
        </View>
      ) : null}
    </View>
  );
}

// ─── Bottom pill (phone / tablet) ────────────────────────────────────────────

function BottomPillTabBar({
  state,
  navigation,
  footerItems,
  isDark,
  palette,
  compact,
}: {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  footerItems: FooterItem[];
  isDark: boolean;
  palette: typeof colors.dark;
  compact: boolean;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const isTV = Platform.isTV;
  const barMaxWidth = isTablet ? Math.min(680, width - 32) : width - 32;
  const barBottomInset = Math.max(insets.bottom, 12);
  const currentRouteName = state.routes[state.index]?.name;

  const navigateTo = (item: FooterItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const canNavigate = routeExists(state.routes, item.routeName) || item.routeName === 'settings';
    if (canNavigate) navigation.navigate(item.routeName as never);
  };

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
      <View
        style={{
          width: '100%',
          maxWidth: barMaxWidth,
          borderRadius: 26,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(56,42,84,0.18)',
          backgroundColor: isDark ? 'rgba(8,5,14,0.98)' : 'rgba(10,6,18,0.98)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.46,
          shadowRadius: 32,
          elevation: 24,
        }}
      >

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

            if (item.center) {
              return (
                <TVTouchable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: focused }}
                  hasTVPreferredFocus={routeIndex === 0}
                  onPress={() => navigateTo(item)}
                  style={{ flex: 1.1, alignItems: 'center', justifyContent: 'center', gap: compact ? 3 : 4, paddingVertical: 2 }}
                  showFocusBorder={false}
                >
                  <View
                    style={{
                      width: compact ? 46 : 52, height: compact ? 46 : 52, borderRadius: 999,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: palette.primary,
                    }}
                  >
                    <MaterialIcons name="play-arrow" size={compact ? 26 : 29} color={palette.textInverse} />
                  </View>
                  <CustomText variant="caption" style={{ color: focused ? '#F6F0FF' : palette.textMuted, fontSize: compact ? 9 : 9.5, lineHeight: 12, fontWeight: focused ? '700' : '400' }} numberOfLines={1}>
                    {item.label}
                  </CustomText>
                  <View style={{ width: focused ? 14 : 4, height: 3, borderRadius: 999, backgroundColor: focused ? '#F6F0FF' : 'transparent', marginTop: 1, opacity: focused ? 0.8 : 0 }} />
                </TVTouchable>
              );
            }

            return (
              <TVTouchable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: focused }}
                hasTVPreferredFocus={routeIndex === 0}
                onPress={() => navigateTo(item)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: compact ? 3 : 4 }}
                focusStyle={{ transform: [{ scale: isTV ? 1.06 : 1 }] }}
                showFocusBorder={false}
              >
                <View
                  style={{
                    width: compact ? 36 : 40, height: compact ? 28 : 30, borderRadius: 999,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: focused ? (isDark ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.14)') : 'transparent',
                  }}
                >
                  <MaterialIcons name={item.icon} size={focused ? (compact ? 21 : 23) : (compact ? 19 : 21)} color={focused ? palette.primary : palette.textMuted} />
                </View>
                <CustomText variant="caption" style={{ color: focused ? '#F6F0FF' : palette.textMuted, fontSize: compact ? 9 : 9.5, lineHeight: 12, fontWeight: focused ? '700' : '400' }} numberOfLines={1}>
                  {item.label}
                </CustomText>
                <View style={{ width: focused ? 14 : 4, height: 3, borderRadius: 999, backgroundColor: focused ? palette.primary : 'transparent', marginTop: 1, opacity: focused ? 0.9 : 0 }} />
              </TVTouchable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const { config } = useMobileAppConfig();

  const sidebarWidth = getSidebarWidth(width);
  const isSidebar = sidebarWidth > 0;
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

  if (isSidebar) {
    return (
      <SidebarTabBar
        state={state}
        navigation={navigation}
        footerItems={footerItems}
        sidebarWidth={sidebarWidth}
        isDark={isDark}
        palette={palette}
      />
    );
  }

  return (
    <BottomPillTabBar
      state={state}
      navigation={navigation}
      footerItems={footerItems}
      isDark={isDark}
      palette={palette}
      compact={compact}
    />
  );
};

export default TabBar;