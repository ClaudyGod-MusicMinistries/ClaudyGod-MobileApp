import React, { useEffect, useRef } from 'react';
import { Image, RefreshControl, View, useWindowDimensions, type ImageSourcePropType , ScrollView } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

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
  // Changing this value scrolls the page back to top — for screens where
  // tapping something in a list updates content further up the page (e.g.
  // Videos' inline player) with no other visible confirmation that the tap
  // actually did anything.
  scrollToTopKey?: string | number;
};

export function PremiumPage({
  title,
  subtitle,
  eyebrow,
  rightAction,
  children,
  refreshing = false,
  onRefresh,
  backgroundImage,
  showFooter = true,
  noBack = false,
  scrollToTopKey,
}: PremiumPageProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const isSidebarMode = getSidebarWidth(width) > 0;
  const showBack = !noBack && title !== 'ClaudyGod' && router.canGoBack();
  const bottomPadding = isSidebarMode ? 40 : theme.layout.tabBarContentPadding;

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollToTopKey !== undefined) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [scrollToTopKey]);

  // The header lives above the ScrollView (not inside it) so back/search/
  // settings stay reachable while scrolled — a plain sibling in the flex
  // column, no absolute positioning needed. This hairline only exists to
  // separate it from content once that content is actually scrolled under
  // it; runs entirely on the UI thread so it costs nothing on the JS thread
  // during scroll.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const headerDividerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 24], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <TabScreenWrapper backgroundImage={backgroundImage} backgroundHeight={compact ? 240 : 320}>
      <Screen contentStyle={{ paddingTop: theme.layout.headerVerticalPadding, paddingBottom: 12 }}>
        <FadeIn>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              gap: compact ? 8 : 10,
              paddingVertical: compact ? 10 : 12,
              paddingHorizontal: compact ? 12 : 14,
              borderRadius: 14,
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
                {eyebrow ? (
                  <CustomText style={styles.headerEyebrow} numberOfLines={1}>{eyebrow}</CustomText>
                ) : null}
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
          </View>
        </FadeIn>
        <Animated.View style={[{ height: 1, backgroundColor: theme.colors.border }, headerDividerStyle]} />
      </Screen>

      <Animated.ScrollView
        ref={scrollRef}
        style={styles.pageScroll}
        showsVerticalScrollIndicator={false}
        bounces={Boolean(onRefresh)}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        <Screen>
          <View style={[styles.pageContent, { paddingTop: theme.spacing.lg }]}>
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
