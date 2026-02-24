import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { TVTouchable } from './ui/TVTouchable';
import { CustomText } from './CustomText';

type TabConfig = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  isCenter?: boolean;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  home: { icon: 'home', label: 'Home' },
  videos: { icon: 'ondemand-video', label: 'Videos' },
  PlaySection: { icon: 'music-note', label: 'Player', isCenter: true },
  Favourites: { icon: 'favorite-border', label: 'Library' },
  Settings: { icon: 'person-outline', label: 'Account' },
};

const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme] ?? colors.dark;
  const isDark = colorScheme === 'dark';
  const isTV = Platform.isTV;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 370;
  const isTablet = width >= 768 && !isTV;

  const sizes = {
    barHeight: isTV ? 98 : compact ? 82 : 88,
    buttonSize: isTV ? 56 : compact ? 46 : 48,
    iconSize: isTV ? 25 : 21,
    centerSize: isTV ? 68 : compact ? 56 : 60,
    paddingX: isTV ? 20 : isTablet ? 16 : 10,
    labelSize: compact ? 9 : 10,
  };

  const visibleRoutes = useMemo(
    () => state.routes.filter((route) => Boolean(TAB_CONFIG[route.name])),
    [state.routes],
  );
  const currentRouteKey = state.routes[state.index]?.key;

  const maxWidth = isTV ? 1240 : isTablet ? 900 : width;
  const bottomInset = isTV ? 18 : Math.max(insets.bottom, 8);
  const barHeightWithInset = sizes.barHeight + bottomInset;
  const ui = {
    shellBg: isDark ? '#0E0D15' : palette.background,
    barBg: isDark ? '#0E0D15' : palette.surface,
    barBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
    topLine: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.08)',
    glow: isDark ? 'rgba(154,107,255,0.08)' : 'rgba(109,40,217,0.06)',
    activeTabBg: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.09)',
    activeTabBorder: isDark ? 'rgba(216,194,255,0.16)' : 'rgba(109,40,217,0.14)',
    centerBorder: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(20,16,33,0.08)',
    halo: isDark ? 'rgba(154,107,255,0.12)' : 'rgba(109,40,217,0.1)',
    activeLabel: isDark ? '#F2E8FF' : palette.text.primary,
  } as const;

  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [appear]);

  const barTranslateY = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        backgroundColor: isTablet || isTV ? 'transparent' : ui.shellBg,
        opacity: appear,
        transform: [{ translateY: barTranslateY }],
      }}
    >
      <View style={{ width: '100%', maxWidth }}>
        <View
          style={{
            height: barHeightWithInset,
            borderTopWidth: 1,
            borderTopColor: ui.barBorder,
            backgroundColor: ui.barBg,
            paddingHorizontal: sizes.paddingX,
            paddingBottom: bottomInset,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopLeftRadius: isTablet || isTV ? 20 : 0,
            borderTopRightRadius: isTablet || isTV ? 20 : 0,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[ui.glow, 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 18,
              right: 18,
              height: 1,
              backgroundColor: ui.topLine,
            }}
          />

          {visibleRoutes.map((route, visibleIndex) => {
            const config = TAB_CONFIG[route.name];
            const focused = route.key === currentRouteKey;

            return (
              <TabBarButton
                key={route.key}
                config={config}
                focused={focused}
                isTV={isTV}
                labelSize={sizes.labelSize}
                buttonSize={sizes.buttonSize}
                centerSize={sizes.centerSize}
                iconSize={sizes.iconSize}
                textSecondary={palette.text.secondary}
                primary={palette.primary}
                activeLabel={ui.activeLabel}
                activeTabBg={ui.activeTabBg}
                activeTabBorder={ui.activeTabBorder}
                centerBorder={ui.centerBorder}
                haloColor={ui.halo}
                onPress={() => navigation.navigate(route.name as never)}
                preferredFocus={visibleIndex === 0}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

function TabBarButton({
  config,
  focused,
  isTV,
  labelSize,
  buttonSize,
  centerSize,
  iconSize,
  textSecondary,
  primary,
  activeLabel,
  activeTabBg,
  activeTabBorder,
  centerBorder,
  haloColor,
  onPress,
  preferredFocus,
}: {
  config: TabConfig;
  focused: boolean;
  isTV: boolean;
  labelSize: number;
  buttonSize: number;
  centerSize: number;
  iconSize: number;
  textSecondary: string;
  primary: string;
  activeLabel: string;
  activeTabBg: string;
  activeTabBorder: string;
  centerBorder: string;
  haloColor: string;
  onPress: () => void;
  preferredFocus: boolean;
}) {
  const isCenter = Boolean(config.isCenter);
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [anim, focused]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isCenter ? 1.03 : 1.02],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isCenter ? -2 : -1],
  });
  const labelOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const haloOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const baseSize = isCenter ? centerSize : buttonSize;

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }], alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {!isCenter ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -2,
              width: baseSize + 10,
              height: baseSize + 20,
              borderRadius: 18,
              backgroundColor: haloColor,
              opacity: haloOpacity,
            }}
          />
        ) : null}

        <TVTouchable
          accessibilityRole="button"
          accessibilityLabel={config.label}
          hasTVPreferredFocus={preferredFocus}
          onPress={onPress}
          style={{
            minWidth: isCenter ? baseSize : baseSize + 12,
            height: isCenter ? baseSize : baseSize + 22,
            borderRadius: isCenter ? baseSize / 2 : 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isCenter
              ? primary
              : focused
              ? activeTabBg
              : 'transparent',
            borderWidth: isCenter ? 1 : focused ? 1 : 0,
            borderColor: isCenter ? centerBorder : activeTabBorder,
            paddingHorizontal: isCenter ? 0 : 8,
            marginTop: isCenter ? -10 : 0,
          }}
          focusStyle={{ transform: [{ scale: isTV ? 1.08 : 1.03 }] }}
          showFocusBorder={false}
        >
          <MaterialIcons
            name={config.icon}
            size={isCenter ? iconSize + 3 : iconSize}
            color={isCenter || focused ? '#FFFFFF' : textSecondary}
          />

          {!isCenter ? (
            <Animated.View style={{ opacity: labelOpacity, marginTop: 3 }}>
              <CustomText
                variant="caption"
                style={{
                  color: focused ? activeLabel : textSecondary,
                  fontSize: labelSize,
                  lineHeight: labelSize + 3,
                  letterSpacing: 0.1,
                }}
              >
                {config.label}
              </CustomText>
            </Animated.View>
          ) : null}
        </TVTouchable>
      </View>
    </Animated.View>
  );
}

export default TabBar;
