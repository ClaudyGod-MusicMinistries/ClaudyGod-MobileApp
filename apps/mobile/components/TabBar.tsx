import React, { useMemo } from 'react';
import { Image, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
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
        left: 0, top: 0, bottom: 0,
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
          <View style={{ width: isTV ? 44 : 38, height: isTV ? 44 : 38, borderRadius: 12, overflow: 'hidden', backgroundColor: palette.surface, borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)' }}>
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText style={{ color: '#FFFFFF', fontSize: isTV ? 16 : 14, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={1}>ClaudyGod</CustomText>
            <CustomText style={{ color: palette.textMuted, fontSize: isTV ? 11 : 10, marginTop: 1 }} numberOfLines={1}>Worship & Ministry</CustomText>
          </View>
        </View>

        {/* Main nav items */}
        <View style={{ gap: 2 }}>
          {mainItems.map((item) => {
            const focused = currentRouteName === item.routeName;
            return (
              <TVTouchable
                key={item.key}
                onPress={() => navigateTo(item)}
                showFocusBorder={false}
                focusStyle={{ transform: [{ scale: 1.02 }] }}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  gap: isTV ? 14 : 12,
                  paddingVertical: isTV ? 13 : 11,
                  paddingHorizontal: isTV ? 14 : 12,
                  borderRadius: 14,
                  backgroundColor: focused ? (isDark ? 'rgba(139,92,246,0.14)' : 'rgba(124,58,237,0.10)') : 'transparent',
                  borderWidth: focused ? 1 : 0,
                  borderColor: focused ? 'rgba(139,92,246,0.24)' : 'transparent',
                }}
              >
                <View style={{
                  width: isTV ? 36 : 30, height: isTV ? 36 : 30, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: focused
                    ? (item.center ? palette.primary : (isDark ? 'rgba(139,92,246,0.20)' : 'rgba(124,58,237,0.14)'))
                    : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                }}>
                  <MaterialIcons
                    name={item.center ? 'play-arrow' : item.icon}
                    size={isTV ? 20 : 17}
                    color={item.center ? '#FFFFFF' : (focused ? palette.primary : palette.textMuted)}
                  />
                </View>
                <CustomText style={{ color: focused ? '#F7F2FF' : palette.textMuted, fontSize: isTV ? 15 : 13.5, fontWeight: focused ? '700' : '500', flex: 1 }}>
                  {item.label}
                </CustomText>
                {focused ? <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: palette.primary }} /> : null}
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
              flexDirection: 'row', alignItems: 'center',
              gap: isTV ? 14 : 12,
              paddingVertical: isTV ? 12 : 10,
              paddingHorizontal: isTV ? 14 : 12,
              borderRadius: 14,
              backgroundColor: currentRouteName === 'settings'
                ? (isDark ? 'rgba(139,92,246,0.12)' : 'rgba(124,58,237,0.08)')
                : 'transparent',
            }}
          >
            <View style={{ width: isTV ? 36 : 30, height: isTV ? 36 : 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }}>
              <MaterialIcons name="tune" size={isTV ? 18 : 16} color={currentRouteName === 'settings' ? palette.primary : palette.textMuted} />
            </View>
            <CustomText style={{ color: currentRouteName === 'settings' ? '#F7F2FF' : palette.textMuted, fontSize: isTV ? 14 : 13, fontWeight: currentRouteName === 'settings' ? '700' : '500' }}>
              Settings
            </CustomText>
          </TVTouchable>
        </View>
      ) : null}
    </View>
  );
}

// ─── Tab item (left/right non-center) ────────────────────────────────────────

function TabItem({
  item,
  focused,
  compact,
  palette,
  onPress,
}: {
  item: FooterItem;
  focused: boolean;
  compact: boolean;
  palette: typeof colors.dark;
  onPress: () => void;
}) {
  return (
    <TVTouchable
      key={item.key}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 3 }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: focused ? (compact ? 42 : 46) : (compact ? 32 : 36),
          height: compact ? 28 : 30,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? 'rgba(139,92,246,0.18)' : 'transparent',
        }}
      >
        <MaterialIcons
          name={item.icon}
          size={focused ? (compact ? 20 : 22) : (compact ? 18 : 20)}
          color={focused ? palette.primary : palette.textMuted}
        />
      </View>
      {focused ? (
        <CustomText style={{ color: '#F6F0FF', fontSize: compact ? 8.5 : 9, lineHeight: 11, fontWeight: '700' }} numberOfLines={1}>
          {item.label}
        </CustomText>
      ) : null}
      <View
        style={{
          width: focused ? 14 : 0,
          height: 3,
          borderRadius: 999,
          backgroundColor: focused ? palette.primary : 'transparent',
        }}
      />
    </TVTouchable>
  );
}

// ─── Floating curvy bottom tab bar (phone / tablet) ───────────────────────────

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

  const BAR_HEIGHT    = compact ? 62 : 70;
  const CENTER_SIZE   = compact ? 56 : 64;
  const CENTER_RISE   = 18;               // px the center button pops above the bar top
  const BAR_MARGIN_H  = isTablet ? Math.max(16, (width - Math.min(680, width - 32)) / 2) : 16;
  const BOTTOM_INSET  = Math.max(insets.bottom, 10);

  // center button bottom edge: sit centered in bar + rise above top
  const centerBtnBottom = BOTTOM_INSET + BAR_HEIGHT / 2 - CENTER_SIZE / 2 + CENTER_RISE;

  const currentRouteName = state.routes[state.index]?.name;

  const leftItems  = footerItems.filter((i) => !i.center).slice(0, 2);
  const rightItems = footerItems.filter((i) => !i.center).slice(2);
  const centerItem = footerItems.find((i) => i.center) ?? null;
  const centerFocused = currentRouteName === centerItem?.routeName;

  const navigateTo = (item: FooterItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (routeExists(state.routes, item.routeName) || item.routeName === 'settings') {
      navigation.navigate(item.routeName as never);
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: BOTTOM_INSET + BAR_HEIGHT + CENTER_RISE + CENTER_SIZE / 2,
        pointerEvents: 'box-none',
      }}
    >
      {/* ── Pill bar ────────────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          left: BAR_MARGIN_H,
          right: BAR_MARGIN_H,
          bottom: BOTTOM_INSET,
          height: BAR_HEIGHT,
          borderRadius: BAR_HEIGHT / 2,
          backgroundColor: isDark ? 'rgba(7,4,13,0.97)' : 'rgba(10,6,18,0.97)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(139,92,246,0.22)' : 'rgba(100,60,180,0.20)',
          // Deep drop shadow for the floating effect
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 22 },
          shadowOpacity: 0.55,
          shadowRadius: 40,
          elevation: 30,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          overflow: 'hidden',
        }}
      >
        {leftItems.map((item) => (
          <TabItem
            key={item.key}
            item={item}
            focused={currentRouteName === item.routeName}
            compact={compact}
            palette={palette}
            onPress={() => navigateTo(item)}
          />
        ))}

        {/* Transparent gap where the center button floats */}
        <View style={{ width: CENTER_SIZE + 20 }} />

        {rightItems.map((item) => (
          <TabItem
            key={item.key}
            item={item}
            focused={currentRouteName === item.routeName}
            compact={compact}
            palette={palette}
            onPress={() => navigateTo(item)}
          />
        ))}
      </View>

      {/* ── Floating center button ──────────────────────────────────────── */}
      {centerItem ? (
        <TVTouchable
          accessibilityRole="button"
          accessibilityLabel={centerItem.label}
          accessibilityState={{ selected: centerFocused }}
          onPress={() => navigateTo(centerItem)}
          showFocusBorder={false}
          style={{
            position: 'absolute',
            alignSelf: 'center',
            bottom: centerBtnBottom,
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Glow ring */}
          <View
            style={{
              width: CENTER_SIZE + 10,
              height: CENTER_SIZE + 10,
              borderRadius: (CENTER_SIZE + 10) / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: centerFocused
                ? 'rgba(139,92,246,0.28)'
                : 'rgba(139,92,246,0.14)',
              // Violet glow shadow
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: centerFocused ? 0.65 : 0.35,
              shadowRadius: centerFocused ? 22 : 14,
              elevation: 18,
            }}
          >
            {/* Inner circle */}
            <View
              style={{
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                borderRadius: CENTER_SIZE / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: centerFocused ? palette.primary : `${palette.primary}DD`,
                borderWidth: 2,
                borderColor: centerFocused
                  ? 'rgba(255,255,255,0.22)'
                  : 'rgba(255,255,255,0.10)',
              }}
            >
              <MaterialIcons
                name="play-arrow"
                size={compact ? 28 : 32}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Label below */}
          <CustomText
            style={{
              color: centerFocused ? '#F6F0FF' : 'rgba(246,240,255,0.55)',
              fontSize: compact ? 8.5 : 9,
              lineHeight: 11,
              fontWeight: '700',
              letterSpacing: 0.2,
            }}
            numberOfLines={1}
          >
            {centerItem.label}
          </CustomText>
        </TVTouchable>
      ) : null}
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
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
