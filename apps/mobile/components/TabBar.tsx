import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { layout } from '../styles/designTokens';
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

  const sizes = {
    barHeight: isTV ? 92 : isTablet ? 86 : compact ? 76 : 80,
    iconSize: isTV ? 25 : 21,
    centerSize: isTV ? 66 : 56,
    paddingX: isTV ? 18 : isTablet ? 16 : 14,
  };

  const barMaxWidth = isTV ? 1240 : isTablet ? 880 : width;
  const barBottomInset = isTV ? 18 : Math.max(insets.bottom, 10);

  const tabConfig = {
    home: { icon: 'home-filled' as const, label: 'Home' },
    videos: { icon: 'ondemand-video' as const, label: 'Videos' },
    player: { icon: 'play-arrow' as const, label: 'Player', isCenter: true },
    library: { icon: 'library-music' as const, label: 'Library' },
    search: { icon: 'search' as const, label: 'Search' },
  };

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
          borderColor: palette.border,
          backgroundColor: palette.surface,
          paddingHorizontal: sizes.paddingX,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: isTablet || isTV ? 24 : 22,
          borderTopRightRadius: isTablet || isTV ? 24 : 22,
          shadowColor: '#12092A',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const config = (tabConfig as any)[route.name];
          if (!config) return null;

          const focused = state.index === index;
          const isCenter = Boolean(config.isCenter);

          if (isCenter) {
            return (
              <TVTouchable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={config.label}
                onPress={() => navigation.navigate(route.name as never)}
                style={{
                  width: sizes.centerSize,
                  height: sizes.centerSize,
                  borderRadius: sizes.centerSize / 2,
                  marginTop: -20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.primary,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.44)',
                  shadowColor: palette.primary,
                  shadowOpacity: 0.44,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 10,
                }}
                focusStyle={{ transform: [{ scale: isTV ? 1.1 : 1.04 }] }}
                showFocusBorder={false}
              >
                <MaterialIcons name={config.icon} size={sizes.iconSize + 4} color="#FFFFFF" />
              </TVTouchable>
            );
          }

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
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? `${palette.primary}16` : 'transparent',
              }}
              focusStyle={{ transform: [{ scale: isTV ? 1.08 : 1.02 }] }}
              showFocusBorder={false}
            >
              <MaterialIcons
                name={config.icon}
                size={sizes.iconSize}
                color={focused ? palette.primary : palette.text.secondary}
              />
              <CustomText
                variant="caption"
                style={{
                  marginTop: 3,
                  color: focused ? palette.primary : palette.text.secondary,
                  fontSize: 11,
                }}
              >
                {config.label}
              </CustomText>
            </TVTouchable>
          );
        })}
      </View>
    </View>
  );
};

export default TabBar;
