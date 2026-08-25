import React, { useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../util/colorScheme';
import { layout } from '../styles/designTokens';
import { useMobileAppConfig } from '../hooks/useMobileAppConfig';
import { getSidebarWidth } from '../util/sidebarConfig';
import { TVTouchable } from './ui/TVTouchable';
import { CustomText } from './CustomText';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';
import { AppIcon, type AppIconName } from './ui/AppIcon';
import { useReducedMotion } from '../hooks/useReducedMotion';

// layout.tabBarContentPadding is a structural constant (not theme-varying).
// It must live at module level so non-component code can import it without hooks.
export const BOTTOM_TAB_CONTENT_SPACER = layout.tabBarContentPadding;

type TabRouteName = 'home' | 'player' | 'videos' | 'library' | 'settings';

type FooterItem = {
  routeName: TabRouteName;
  key: string;
  label: string;
  icon: AppIconName;
  center?: boolean;
};

const FOOTER_ORDER: TabRouteName[] = ['home', 'videos', 'player', 'library', 'settings'];

const FOOTER_CONFIG: Record<TabRouteName, Omit<FooterItem, 'routeName' | 'key'>> = {
  home:     { icon: 'home', label: 'Home' },
  player:   { icon: 'play-arrow', label: 'Player', center: true },
  videos:   { icon: 'smart-display', label: 'Videos' },
  library:  { icon: 'library-music', label: 'Library' },
  settings: { icon: 'tune', label: 'Settings' },
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
}: {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  footerItems: FooterItem[];
  sidebarWidth: number;
}) {
  const theme = useAppTheme();
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
        backgroundColor: theme.colors.tabBarBg,
        borderRightWidth: 1,
        borderRightColor: theme.colors.primaryBorder,
        paddingTop: insets.top + (isTV ? 24 : 16),
        paddingBottom: insets.bottom + (isTV ? 24 : 16),
        paddingHorizontal: isTV ? 16 : 12,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: 0 }}>
        {/* Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginBottom: isTV ? 32 : 24 }}>
          <View style={{ width: isTV ? 44 : 38, height: isTV ? 44 : 38, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primaryBorder }}>
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText style={{ color: theme.colors.text, fontSize: isTV ? 16 : 14, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={1}>ClaudyGod</CustomText>
            <CustomText style={{ color: theme.colors.textMuted, fontSize: isTV ? 11 : 10, marginTop: 1 }} numberOfLines={1}>Worship & Ministry</CustomText>
          </View>
        </View>

        {/* Main nav items */}
        <View style={{ gap: 2 }}>
          {mainItems.map((item) => {
            const focused = currentRouteName === item.routeName;
            return (
              <TVTouchable
                key={item.key}
                accessibilityLabel={item.label}
                accessibilityState={{ selected: focused }}
                onPress={() => navigateTo(item)}
                showFocusBorder={false}
                focusStyle={{ transform: [{ scale: 1.02 }] }}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  gap: isTV ? 14 : 12,
                  paddingVertical: isTV ? 13 : 11,
                  paddingHorizontal: isTV ? 14 : 12,
                  borderRadius: theme.radius.md,
                  backgroundColor: focused ? theme.colors.primarySurface : 'transparent',
                  borderWidth: focused ? 1 : 0,
                  borderColor: focused ? theme.colors.primaryBorder : 'transparent',
                }}
              >
                <View style={{
                  width: isTV ? 36 : 30, height: isTV ? 36 : 30, borderRadius: theme.radius.md,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: focused
                    ? theme.colors.primaryBorder
                    : 'transparent',
                }}>
                  <AppIcon
                    name={item.icon}
                    size={isTV ? 21 : 18}
                    color={focused ? theme.colors.primary : theme.colors.textMuted}
                  />
                </View>
                <CustomText style={{ color: focused ? theme.colors.text : theme.colors.textMuted, fontSize: isTV ? 15 : 13.5, fontWeight: focused ? '700' : '500', flex: 1 }}>
                  {item.label}
                </CustomText>
                {focused ? <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.colors.primary }} /> : null}
              </TVTouchable>
            );
          })}
        </View>
      </View>

      {/* Bottom: Settings */}
      {settingsItem ? (
        <View style={{ gap: 8 }}>
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: 8 }} />
          <TVTouchable
            key={settingsItem.key}
            accessibilityLabel="Settings"
            accessibilityState={{ selected: currentRouteName === 'settings' }}
            onPress={() => navigateTo(settingsItem)}
            showFocusBorder={false}
            style={{
              flexDirection: 'row', alignItems: 'center',
              gap: isTV ? 14 : 12,
              paddingVertical: isTV ? 12 : 10,
              paddingHorizontal: isTV ? 14 : 12,
              borderRadius: theme.radius.xl,
              backgroundColor: currentRouteName === 'settings'
                ? theme.colors.primarySurface
                : 'transparent',
            }}
          >
            <View style={{ width: isTV ? 36 : 30, height: isTV ? 36 : 30, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="tune" size={isTV ? 20 : 18} color={currentRouteName === 'settings' ? theme.colors.primary : theme.colors.textMuted} />
            </View>
            <CustomText style={{ color: currentRouteName === 'settings' ? theme.colors.text : theme.colors.textMuted, fontSize: isTV ? 14 : 13, fontWeight: currentRouteName === 'settings' ? '700' : '500' }}>
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
  onPress,
  onLongPress,
}: {
  item: FooterItem;
  focused: boolean;
  compact: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const focusProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: reduceMotion ? 0 : theme.timing.base,
      easing: Easing.out(Easing.cubic),
    });
  }, [focusProgress, focused, reduceMotion, theme.timing.base]);

  const capsuleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      ['transparent', theme.colors.tabBarActiveSurface],
    ),
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      ['transparent', theme.colors.tabBarActiveBorder],
    ),
    transform: [{ scale: 1 + focusProgress.value * 0.04 }],
  }));

  return (
    <TVTouchable
      key={item.key}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, gap: 2 }}
      showFocusBorder={false}
    >
      <Animated.View
        style={[{
          width: focused ? (compact ? 44 : 48) : (compact ? 36 : 40),
          height: compact ? 28 : 30,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
        }, capsuleStyle]}
      >
        <AppIcon
          name={item.icon}
          size={focused ? (compact ? 20 : 22) : (compact ? 18 : 20)}
          color={focused ? theme.colors.tabBarTextActive : theme.colors.tabBarText}
        />
      </Animated.View>
      <CustomText
        style={{ color: focused ? theme.colors.tabBarTextActive : theme.colors.tabBarText, fontSize: compact ? 9 : 10, lineHeight: 12, fontWeight: focused ? '700' : '500' }}
        numberOfLines={1}
      >
        {item.label}
      </CustomText>
    </TVTouchable>
  );
}

function CenterPlayerTab({
  item,
  focused,
  compact,
  onPress,
  onLongPress,
}: {
  item: FooterItem;
  focused: boolean;
  compact: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const actionSize = compact ? layout.tabBarActionCompactSize : layout.tabBarActionSize;
  const focusProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: reduceMotion ? 0 : theme.timing.moderate,
      easing: Easing.out(Easing.cubic),
    });
  }, [focusProgress, focused, reduceMotion, theme.timing.moderate]);

  const cradleStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.colors.tabBarBorder, theme.colors.tabBarActionActiveRing],
    ),
    transform: [
      { translateY: -focusProgress.value * layout.tabBarActionActiveLift },
      { scale: 1 + focusProgress.value * 0.035 },
    ],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focusProgress.value * 0.045 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.76 + focusProgress.value * 0.24,
    transform: [{ translateY: -focusProgress.value }],
  }));

  return (
    <TVTouchable
      accessibilityRole="tab"
      accessibilityLabel="Open player"
      accessibilityHint="Opens the music player"
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      showFocusBorder={false}
      style={{
        flex: 1,
        height: layout.tabBarHeight + layout.tabBarActionLift,
        marginTop: -layout.tabBarActionLift,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Animated.View
        style={[{
          width: actionSize + layout.tabBarActionRingWidth * 2,
          height: actionSize + layout.tabBarActionRingWidth * 2,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.tabBarBg,
          borderWidth: 1,
        }, cradleStyle]}
      >
        <Animated.View
          style={[{
            width: actionSize,
            height: actionSize,
            borderRadius: theme.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.tabBarActionSurface,
            ...theme.shadows.lg,
          }, actionStyle]}
        >
          <View style={{ transform: [{ translateX: layout.tabBarPlayIconOpticalOffset }] }}>
            <AppIcon name={item.icon} size={compact ? 24 : 27} color={theme.colors.tabBarActionIcon} />
          </View>
        </Animated.View>
      </Animated.View>
      <Animated.View style={labelStyle}>
        <CustomText
          numberOfLines={1}
          style={{
            color: focused ? theme.colors.tabBarTextActive : theme.colors.tabBarText,
            fontSize: compact ? 9 : 10,
            lineHeight: 12,
            fontWeight: focused ? '700' : '600',
            marginTop: 1,
          }}
        >
          {item.label}
        </CustomText>
      </Animated.View>
    </TVTouchable>
  );
}

// ─── Opaque bottom navigation dock (phone / tablet) ──────────────────────────

function BottomPillTabBar({
  state,
  navigation,
  footerItems,
  compact,
}: {
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  footerItems: FooterItem[];
  compact: boolean;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  const barHeight = compact ? layout.tabBarCompactHeight : layout.tabBarHeight;
  const contentWidth = isTablet ? Math.min(layout.tabBarMaxWidth, width) : width;
  const horizontalInset = Math.max(0, (width - contentWidth) / 2);

  const currentRouteName = state.routes[state.index]?.name;

  const navigateTo = (item: FooterItem) => {
    const focused = currentRouteName === item.routeName;
    const event = navigation.emit({ type: 'tabPress', target: item.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented && (routeExists(state.routes, item.routeName) || item.routeName === 'settings')) {
      void Haptics.selectionAsync();
      navigation.navigate(item.routeName as never);
    }
  };

  const longPress = (item: FooterItem) => {
    navigation.emit({ type: 'tabLongPress', target: item.key });
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: insets.bottom + barHeight,
        backgroundColor: theme.colors.tabBarBg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.tabBarBorder,
        ...theme.shadows.md,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: horizontalInset,
          right: horizontalInset,
          top: 0,
          height: barHeight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: compact ? 4 : 8,
        }}
      >
        {footerItems.map((item) => {
          const sharedProps = {
            key: item.key,
            item,
            focused: currentRouteName === item.routeName,
            compact,
            onPress: () => navigateTo(item),
            onLongPress: () => longPress(item),
          };
          return item.center ? <CenterPlayerTab {...sharedProps} /> : <TabItem {...sharedProps} />;
        })}
      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const { config } = useMobileAppConfig();

  const sidebarWidth = getSidebarWidth(width);
  const isSidebar = sidebarWidth > 0;

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
        label: dynamic?.label ?? fallback.label,
        icon: dynamic?.icon || fallback.icon,
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
      />
    );
  }

  return (
    <BottomPillTabBar
      state={state}
      navigation={navigation}
      footerItems={footerItems}
      compact={compact}
    />
  );
};

export default TabBar;
