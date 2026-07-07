import React, { useRef } from 'react';
import { Animated, Image, RefreshControl, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { TabScreenWrapper } from '../layout/TabScreenWrapper';
import { getSidebarWidth } from '../../util/sidebarConfig';
import { AppScreenFooter } from '../layout/AppScreenFooter';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { useFeedStyles } from './styles';

type PremiumPageProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  backgroundImage?: ImageSourcePropType;
  showFooter?: boolean;
  noBack?: boolean;
};

export function PremiumPage({
  title,
  subtitle,
  eyebrow: _eyebrow,
  rightAction,
  children,
  refreshing = false,
  onRefresh,
  backgroundImage,
  showFooter = true,
  noBack = false,
}: PremiumPageProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const isSidebarMode = getSidebarWidth(width) > 0;
  const showBack = !noBack && title !== 'ClaudyGod' && router.canGoBack();
  const bottomPadding = isSidebarMode ? 40 : theme.layout.tabBarContentPadding;

  const scrollY = useRef(new Animated.Value(0)).current;
  const bgRgba  = theme.colors.backgroundRgba;
  const headerBg = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [`rgba(${bgRgba},0)`, `rgba(${bgRgba},0.96)`],
    extrapolate: 'clamp',
  });

  return (
    <TabScreenWrapper backgroundImage={backgroundImage} backgroundHeight={compact ? 240 : 320}>
      <Animated.ScrollView
        style={styles.pageScroll}
        showsVerticalScrollIndicator={false}
        bounces={Boolean(onRefresh)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        <Screen>
          <View style={styles.pageContent}>
            <FadeIn>
              <Animated.View
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  gap: compact ? 8 : 10,
                  paddingVertical: compact ? 10 : 12,
                  paddingHorizontal: compact ? 12 : 14,
                  borderRadius: 14,
                  backgroundColor: headerBg,
                }}
              >
                <View style={styles.headerLeft}>
                  <TVTouchable
                    onPress={() => (showBack ? router.back() : router.push(APP_ROUTES.tabs.home))}
                    showFocusBorder={false}
                    accessibilityRole="button"
                    accessibilityLabel={showBack ? 'Go back' : 'Go home'}
                    style={{
                      width: compact ? 36 : 40, height: compact ? 36 : 40,
                      borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: showBack ? theme.colors.subtleFillMed : theme.colors.subtleFill,
                      overflow: 'hidden', flexShrink: 0,
                    }}
                  >
                    {showBack ? (
                      <MaterialIcons name="arrow-back-ios-new" size={17} color={theme.colors.text} />
                    ) : (
                      <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={common.imgFill} />
                    )}
                  </TVTouchable>

                  <View style={common.flex1}>
                    <CustomText
                      variant="heading"
                      style={[styles.headerTitle, { fontSize: compact ? 16 : 18 }]}
                      numberOfLines={1}
                    >
                      {title}
                    </CustomText>
                    {subtitle && !compact && title !== 'ClaudyGod' ? (
                      <CustomText variant="caption" style={styles.headerSubtitle} numberOfLines={1}>
                        {subtitle}
                      </CustomText>
                    ) : null}
                  </View>
                </View>

                <View style={styles.headerRight}>
                  {rightAction ? <View>{rightAction}</View> : null}
                  <NavIconButton icon="search" label="Search" onPress={() => router.push(APP_ROUTES.tabs.search)} size={compact ? 36 : 40} borderColor={theme.colors.border} iconColor={theme.colors.text} />
                  <NavIconButton icon="settings" label="Settings" onPress={() => router.push(APP_ROUTES.tabs.settings)} size={compact ? 36 : 40} borderColor={theme.colors.border} iconColor={theme.colors.text} />
                </View>
              </Animated.View>
            </FadeIn>

            {children}
            {showFooter ? <AppScreenFooter /> : null}
          </View>
        </Screen>
      </Animated.ScrollView>
    </TabScreenWrapper>
  );
}

function NavIconButton({ icon, label, onPress, size, borderColor, iconColor, accent = false, accentColor }: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  size: number;
  borderColor: string;
  iconColor: string;
  accent?: boolean;
  accentColor?: string;
}) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.navIconBtn, { width: size, height: size, borderColor, backgroundColor: accent ? accentColor : theme.colors.subtleFillMed }]}
    >
      <MaterialIcons name={icon} size={18} color={iconColor} />
    </TVTouchable>
  );
}
