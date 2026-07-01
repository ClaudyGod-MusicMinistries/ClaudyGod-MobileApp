import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { TabScreenWrapper } from '../layout/TabScreenWrapper';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { getSidebarWidth } from '../../util/sidebarConfig';
import { AppButton } from '../ui/AppButton';
import { AppScreenFooter } from '../layout/AppScreenFooter';
import { TVTouchable } from '../ui/TVTouchable';
import { ActionSheet } from '../ui/ActionSheet';
import type { ActionSheetAction } from '../ui/ActionSheet';
import { FadeIn } from '../ui/FadeIn';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { common } from '../../styles/commonStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { BRAND_LOGO_ASSET, BRAND_MUSIC_ASSET, BRAND_WORSHIP_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export type QuickAction = {
  label: string;
  hint?: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
};

function cleanFeedText(value?: string | null): string {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function isValidDuration(d: string | null | undefined): boolean {
  if (!d) return false;
  const trimmed = d.trim();
  return trimmed.length > 0 && trimmed !== '--:--' && trimmed !== '0:00' && trimmed !== '00:00';
}

export function formatFeedMeta(item: FeedCardItem) {
  return [cleanFeedText(item.subtitle), isValidDuration(item.duration) ? item.duration : null].filter(Boolean).join(' · ');
}

export function dedupeFeedItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];
  for (const item of items) {
    const key =
      item.mediaUrl && item.mediaUrl.trim().length > 0
        ? `media:${item.mediaUrl.trim()}`
        : `id:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function getFeaturedItem(...groups: (FeedCardItem[] | null | undefined)[]) {
  for (const group of groups) {
    const item = group?.find((entry) => entry && entry.title);
    if (item) return item;
  }
  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // PremiumPage
  pageScroll:         { flex: 1, backgroundColor: 'transparent' },
  pageContent:        { paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap },
  headerLeft:         { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  headerTitle:        { color: theme.colors.text, fontWeight: '700', letterSpacing: -0.3 },
  headerSubtitle:     { color: theme.colors.textSecondary, marginTop: 2, maxWidth: 720, fontSize: 12 },
  headerRight:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },

  // NavIconButton
  navIconBtn: {
    borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFillMed,
    borderWidth: 1,
  },

  // PremiumHero
  heroContainer: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  heroBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  heroBadgeDot:      { width: 6, height: 6, borderRadius: 3 },
  heroMetaText:      { color: 'rgba(255,255,255,0.52)', fontSize: 11, marginTop: 5, letterSpacing: 0.2 },
  heroSubtitle:      { color: 'rgba(255,255,255,0.76)', marginTop: 6, maxWidth: 520, lineHeight: 20 },
  heroButtons:       { flexDirection: 'row', gap: 8, marginTop: 14 },

  // QuickActionGrid
  quickCompactItem:  { alignItems: 'center', gap: 8, width: 68 },
  quickCompactCircle: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  quickCompactLabel: { color: theme.colors.text, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  quickWideCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: theme.radius.card, borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.subtleFill,
  },
  quickWideLabel:    { color: theme.colors.text, fontSize: 13.5, fontWeight: '600' },
  quickWideHint:     { color: theme.colors.textMuted, marginTop: 2 },

  // ContentCard
  artworkContainer: {
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  liveBadge: {
    position: 'absolute', top: 7, left: 7,
    borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.92)',
    paddingHorizontal: 7, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  liveBadgeDot:    { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' },
  liveBadgeText:   { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  durationPill: {
    position: 'absolute', right: 7, bottom: 7,
    borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText:    { color: '#FFFFFF', fontSize: 9, fontWeight: '500' },
  cardTextArea:    { gap: 3, paddingTop: 1 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  cardTitle:       { color: theme.colors.text, fontSize: 13, lineHeight: 18, fontWeight: '600', flex: 1 },
  cardMoreBtn:     { paddingTop: 2 },
  cardSubtitle:    { color: theme.colors.textMuted, fontSize: 11 },

  // ContentRail
  railGap:         { gap: 12 },
  railHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  railTitleWrap:   { flex: 1, minWidth: 0 },
  railTitle:       { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  railSubtitle:    { color: theme.colors.textMuted, marginTop: 3, fontSize: 12.5 },
  railActionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 6, paddingLeft: 12 },
  railActionText:  { color: theme.colors.primary, fontSize: 12.5, fontWeight: '600' },

  // InlineEmpty
  inlineEmpty: {
    minHeight: 96, borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inlineEmptyIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
  },
  inlineEmptyTitle:   { color: theme.colors.text },
  inlineEmptyMessage: { color: theme.colors.textSecondary, marginTop: 3 },

  // ContentList
  listTitle:     { color: theme.colors.text, marginBottom: 12, fontWeight: '700', letterSpacing: -0.2 },
  listItemThumb: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
  },
  listItemImg:    { width: '100%', height: '100%' },
  listDuration: {
    position: 'absolute', right: 5, bottom: 5, borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.76)', paddingHorizontal: 5, paddingVertical: 2,
  },
  listDurationText:  { color: '#FFFFFF', fontSize: 9 },
  listItemTitle:     { color: theme.colors.text, lineHeight: 18, fontWeight: '600' },
  listItemSubtitle:  { color: theme.colors.textSecondary, marginTop: 4 },

  // CompactContentRow
  compactRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  compactThumb: {
    width: 56, height: 56, borderRadius: 12,
    overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
  },
  compactTitle:      { color: theme.colors.text, fontWeight: '600' },
  compactSubtitle:   { color: theme.colors.textSecondary, marginTop: 3 },

  // EmptyState
  emptyContainer:    { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    marginBottom: 16,
  },
  emptyTitle:    { color: theme.colors.text, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  emptyMessage:  { color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20, fontSize: 13, maxWidth: 300 },

  // TrendingList
  trendingHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendingTitle:    { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  trendingActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  trendingActionText: { color: theme.colors.primary, fontSize: 11.5, fontWeight: '600' },
  trendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  trendingFirstRow:  { borderTopWidth: 0 },
  trendingArtwork: {
    width: 58, height: 58, borderRadius: 12,
    overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
  },
  trendingItemTitle:    { color: theme.colors.text, fontWeight: '600' },
  trendingItemSubtitle: { color: theme.colors.textSecondary, marginTop: 3 },
  trendingPlayBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },

  // FeaturedSectionCard
  featuredHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingLeft: 10 },
  featuredActionText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  featuredCardShell: { borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt },
  featuredLiveBadge: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  featuredLiveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  featuredLiveText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  featuredPlayRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featuredPlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  featuredSubText:  { color: 'rgba(255,255,255,0.55)', fontSize: 12 },

  // StreamingBanner
  streamingCard: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  streamingInner:   { flexDirection: 'row', alignItems: 'stretch' },
  streamingBadge: {
    alignSelf: 'flex-start', borderRadius: 999,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  streamingBadgeText: { color: theme.colors.primary, fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  streamingSubtitle:  { color: theme.colors.textSecondary, lineHeight: 17 },
  streamingCtaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, backgroundColor: theme.colors.primary,
  },
  streamingCtaText: { color: theme.colors.textInverse, fontSize: 12, fontWeight: '700' },

  // GreetingBanner
  greetingRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 2 },
  greetingLeft:      { gap: 4, flex: 1, minWidth: 0 },
  greetingTitle:     { color: theme.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30 },
  greetingDate:      { color: theme.colors.textMuted, fontSize: 13, fontWeight: '400', lineHeight: 19 },
  greetingNotifBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
    flexShrink: 0, marginLeft: 12,
  },

  // ContentShortcuts
  shortcutItem:      { alignItems: 'center', gap: 8, paddingHorizontal: 2, minWidth: 70 },
  shortcutLabel:     { color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '500', textAlign: 'center' },

  // LiveNowBanner
  liveCard:          { borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface },
  liveBgImage:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.10 },
  liveIndicator: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.dangerSurface,
    borderWidth: 1, borderColor: theme.colors.dangerBorder,
  },
  liveDot:           { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.danger },
  liveLabel:         { color: theme.colors.danger, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 5 },
  liveItemTitle:     { color: theme.colors.text, fontWeight: '700' },
  liveItemSubtitle:  { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 },
  liveJoinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999, backgroundColor: theme.colors.danger,
  },
  liveJoinText:      { color: theme.colors.onPrimary, fontSize: 12.5, fontWeight: '700' },

  // WordOfDayCard
  wordCard: {
    borderRadius: theme.radius.xl, overflow: 'hidden', borderWidth: 1,
    borderColor: theme.colors.warningBorder,
    backgroundColor: theme.colors.warningSurface,
  },
  wordAccentBar:     { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: theme.colors.warning },
  wordContent:       { padding: 18, paddingLeft: 20 },
  wordLabelRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  wordLabel:         { color: theme.colors.warning, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', fontSize: 10 },
  wordTitle:         { color: theme.colors.text, fontWeight: '700', fontSize: 16, lineHeight: 23 },
  wordBody:          { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 19, fontSize: 13 },
  wordReadMore:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  wordReadMoreText:  { color: theme.colors.primary, fontWeight: '600' },

  // SectionLabel
  sectionLabelRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabelTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.4, flex: 1 },
  sectionActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: 6, paddingLeft: 12, paddingRight: 2,
  },
  sectionActionText: { color: theme.colors.primary, fontSize: 12.5, fontWeight: '600' },
  sectionSubtitle:   { color: theme.colors.textMuted, marginTop: 3, fontSize: 12.5 },
}));

// ─── PremiumPage ──────────────────────────────────────────────────────────────

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
  const styles = useStyles();
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

// ─── NavIconButton ────────────────────────────────────────────────────────────

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
  const styles = useStyles();
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

// ─── PremiumHero ──────────────────────────────────────────────────────────────

type PremiumHeroProps = {
  item?: FeedCardItem | null;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  actionLabel?: string;
  primaryLabel?: string;
  primaryIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  secondaryLabel?: string;
  secondaryIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onPrimaryPress?: () => void;
  onPrimary?: () => void;
  onSecondaryPress?: () => void;
  onSecondary?: () => void;
  height?: number;
};

export function PremiumHero({
  item, title, subtitle, eyebrow,
  actionLabel, primaryLabel, primaryIcon = 'play-arrow',
  secondaryLabel, secondaryIcon = 'search',
  onPrimaryPress, onPrimary, onSecondaryPress, onSecondary,
  height,
}: PremiumHeroProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const isWide  = device.width >= 760;
  const isLarge = device.isDesktop || device.isTV;
  const heroHeight = height ?? (device.isTV ? 540 : device.isLargeDesktop ? 480 : isLarge ? 420 : isWide ? 360 : 310);
  const imageUrl = item?.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const primaryAction    = onPrimary ?? onPrimaryPress;
  const secondaryAction  = onSecondary ?? onSecondaryPress;
  const resolvedPrimaryLabel = primaryLabel ?? actionLabel ?? 'Play now';
  const isLiveItem = item?.isLive;

  return (
    <FadeIn delay={30} duration={500}>
      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image source={item ? { uri: imageUrl } : BRAND_WORSHIP_ASSET} resizeMode="cover" style={common.fill} />

        <LinearGradient
          colors={isWide
            ? ['rgba(5,4,10,0.10)', 'rgba(5,4,10,0.50)', 'rgba(5,4,10,0.96)']
            : ['rgba(5,4,10,0.06)', 'rgba(5,4,10,0.60)', 'rgba(5,4,10,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: isWide ? 0.7 : 0, y: 1 }}
          style={[common.fill, Platform.OS === 'web' ? { pointerEvents: 'none' } : {}]}
        />

        <View style={{ flex: 1, justifyContent: 'flex-end', padding: isWide ? 26 : 20 }}>
          <View style={{ maxWidth: isWide ? 580 : undefined }}>
            {(isLiveItem || eyebrow || item) ? (
              <View style={[styles.heroBadge, {
                borderColor: isLiveItem ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.28)',
                backgroundColor: isLiveItem ? 'rgba(244,63,94,0.18)' : 'rgba(0,0,0,0.52)',
              }]}>
                {isLiveItem ? <View style={[styles.heroBadgeDot, { backgroundColor: theme.colors.danger }]} /> : null}
                <CustomText style={{
                  color: isLiveItem ? theme.colors.danger : 'rgba(255,255,255,0.9)',
                  fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  {isLiveItem ? 'Live now' : eyebrow ?? (item?.type === 'video' ? 'Featured video' : 'Featured')}
                </CustomText>
              </View>
            ) : null}

            <CustomText
              variant="display"
              style={{
                color: '#FFFFFF',
                fontSize: device.isTV ? 42 : device.isLargeDesktop ? 36 : isLarge ? 30 : isWide ? 25 : 21,
                lineHeight: device.isTV ? 52 : device.isLargeDesktop ? 44 : isLarge ? 38 : isWide ? 32 : 28,
                fontWeight: '800', letterSpacing: -0.5,
              }}
              numberOfLines={2}
            >
              {item?.title || title || 'Welcome to ClaudyGod'}
            </CustomText>

            {item ? (
              <CustomText style={styles.heroMetaText}>
                {[item.subtitle, isValidDuration(item.duration) ? item.duration : null].filter(Boolean).join(' · ')}
              </CustomText>
            ) : null}

            <CustomText variant="body" style={styles.heroSubtitle} numberOfLines={2}>
              {item?.description || subtitle || 'Worship, messages, live ministry, and videos.'}
            </CustomText>

            <View style={styles.heroButtons}>
              {primaryAction ? (
                <AppButton
                  title={resolvedPrimaryLabel}
                  onPress={primaryAction}
                  size="md"
                  leftIcon={<MaterialIcons name={primaryIcon} size={18} color={theme.colors.textInverse} />}
                  style={{ flex: 1 }}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="md"
                  onPress={secondaryAction}
                  textColor="#FFFFFF"
                  leftIcon={<MaterialIcons name={secondaryIcon} size={17} color="#FFFFFF" />}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' }}
                />
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </FadeIn>
  );
}

// ─── QuickActionGrid ──────────────────────────────────────────────────────────

function getActionAccent(icon: string, theme: ReturnType<typeof useAppTheme>): string {
  const map: Record<string, string> = {
    'graphic-eq': theme.colors.primary, 'smart-display': theme.colors.info,
    'live-tv': theme.colors.danger, search: theme.colors.success,
    headphones: theme.colors.primary, library: theme.colors.warning,
  };
  return map[icon] ?? theme.colors.primary;
}

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;

  if (compact) {
    return (
      <FadeIn delay={80}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 2, paddingVertical: 4 }}>
          {actions.map((action) => {
            const accent = getActionAccent(action.icon, theme);
            return (
              <TVTouchable key={action.label} onPress={action.onPress} showFocusBorder={false}>
                <View style={styles.quickCompactItem}>
                  <View style={styles.quickCompactCircle}>
                    <MaterialIcons name={action.icon} size={26} color={accent} />
                  </View>
                  <CustomText variant="caption" style={styles.quickCompactLabel} numberOfLines={1}>
                    {action.label}
                  </CustomText>
                </View>
              </TVTouchable>
            );
          })}
        </ScrollView>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={80}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {actions.map((action) => {
          const accent = getActionAccent(action.icon, theme);
          return (
            <TVTouchable key={action.label} onPress={action.onPress} showFocusBorder={false} style={{ flex: 1 }}>
              <View style={styles.quickWideCard}>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}1A` }}>
                  <MaterialIcons name={action.icon} size={20} color={accent} />
                </View>
                <View style={common.flex1}>
                  <CustomText variant="label" style={styles.quickWideLabel} numberOfLines={1}>{action.label}</CustomText>
                  {action.hint ? (
                    <CustomText variant="caption" style={styles.quickWideHint} numberOfLines={1}>{action.hint}</CustomText>
                  ) : null}
                </View>
              </View>
            </TVTouchable>
          );
        })}
      </View>
    </FadeIn>
  );
}

// ─── ContentCard ──────────────────────────────────────────────────────────────

type CardVariant = 'portrait' | 'landscape' | 'square';

type ContentCardProps = {
  item: FeedCardItem;
  onPress: () => void;
  compact?: boolean;
  variant?: CardVariant;
  fixedWidth?: number;
};

export function ContentCard({ item, onPress, compact = false, variant = 'portrait', fixedWidth }: ContentCardProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const pressScale = useRef(new Animated.Value(1)).current;
  const [menuOpen, setMenuOpen] = useState(false);

  const menuActions: ActionSheetAction[] = [
    { key: 'play', label: item.type === 'video' ? 'Watch now' : 'Play now', icon: item.type === 'video' ? 'play-circle-filled' : 'play-arrow', tone: 'accent', onPress: () => { setMenuOpen(false); onPress(); } },
    { key: 'queue', label: 'Add to queue', icon: 'queue-music', onPress: () => setMenuOpen(false) },
    { key: 'share', label: 'Share', icon: 'share', onPress: () => { setMenuOpen(false); void Share.share({ title: item.title, message: item.subtitle ? `${item.title} — ${item.subtitle}` : item.title }); } },
    { key: 'details', label: 'View details', icon: 'info-outline', onPress: () => setMenuOpen(false) },
  ];

  const cardWidth = fixedWidth ?? (compact ? 170 : device.isTV ? 280 : device.isDesktop ? 220 : 196);
  const cardHeight = variant === 'portrait' ? Math.round(cardWidth * 1.45) : variant === 'landscape' ? Math.round(cardWidth * 0.62) : cardWidth;
  const scrimHeight = variant === 'portrait' ? Math.round(cardHeight * 0.55) : variant === 'landscape' ? Math.round(cardHeight * 0.60) : Math.round(cardHeight * 0.50);
  const title = cleanFeedText(item.title);

  const handlePressIn  = () => Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: USE_NATIVE_DRIVER, friction: 10, tension: 120 }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 7, tension: 70 }).start();

  return (
    <TVTouchable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} showFocusBorder={false} style={{ width: cardWidth }}>
      <Animated.View style={{ gap: 7, transform: [{ scale: pressScale }] }}>
        <View style={[styles.artworkContainer, { width: cardWidth, height: cardHeight }]}>
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.68)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: scrimHeight }} />
          {item.isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveBadgeDot} />
              <CustomText style={styles.liveBadgeText}>LIVE</CustomText>
            </View>
          ) : null}
          {isValidDuration(item.duration) && !item.isLive ? (
            <View style={styles.durationPill}>
              <CustomText style={styles.durationText}>{item.duration}</CustomText>
            </View>
          ) : null}
        </View>

        <View style={styles.cardTextArea}>
          <View style={styles.cardTitleRow}>
            <CustomText variant="label" style={styles.cardTitle} numberOfLines={2}>{title}</CustomText>
            <Pressable onPress={(e) => { e.stopPropagation?.(); setMenuOpen(true); }} hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }} style={styles.cardMoreBtn}>
              <MaterialIcons name="more-vert" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          {item.subtitle ? (
            <CustomText variant="caption" style={styles.cardSubtitle} numberOfLines={1}>{cleanFeedText(item.subtitle)}</CustomText>
          ) : null}
        </View>
      </Animated.View>

      <ActionSheet visible={menuOpen} title={title} description={item.subtitle ? cleanFeedText(item.subtitle) : undefined} actions={menuActions} onClose={() => setMenuOpen(false)} />
    </TVTouchable>
  );
}

// ─── RailSkeleton ─────────────────────────────────────────────────────────────

function RailSkeleton() {
  const { width } = useWindowDimensions();
  const compact   = width < 430;
  const isDesktop = width >= 1024;
  const cardWidth = compact ? 170 : isDesktop ? 220 : 196;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 20 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: cardWidth, gap: 10 }}>
          <SkeletonLoader width={cardWidth} height={Math.round(cardWidth * 1.45)} borderRadius={10} />
          <View style={{ gap: 7, paddingHorizontal: 2 }}>
            <SkeletonLoader width="80%" height={13} borderRadius={999} />
            <SkeletonLoader width="52%" height={11} borderRadius={999} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── InlineEmpty ──────────────────────────────────────────────────────────────

function InlineEmpty({ title, message, icon = 'library-music' }: {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <View style={styles.inlineEmpty}>
      <View style={styles.inlineEmptyIcon}>
        <MaterialIcons name={icon} size={17} color={theme.colors.primary} />
      </View>
      <View style={common.flex1}>
        <CustomText variant="label" style={styles.inlineEmptyTitle} numberOfLines={1}>{title}</CustomText>
        <CustomText variant="caption" style={styles.inlineEmptyMessage} numberOfLines={2}>{message}</CustomText>
      </View>
    </View>
  );
}

// ─── ContentRailInner ─────────────────────────────────────────────────────────

function ContentRailInner({ items, title, onPressItem, isCompact, cardVariant = 'portrait' }: {
  items: FeedCardItem[];
  title: string;
  onPressItem: (_item: FeedCardItem) => void;
  isCompact: boolean;
  cardVariant?: CardVariant;
}) {
  const device = useDeviceClass();
  const sidebarWidth = getSidebarWidth(device.width);

  if (device.isDesktop || device.isTV) {
    const numCols      = device.isTV ? 6 : device.isLargeDesktop ? 5 : 4;
    const availableWidth = Math.min(device.maxContentWidth, device.width - device.contentGutter * 2 - sidebarWidth);
    const gap            = 14;
    const cardWidth      = Math.floor((availableWidth - (numCols - 1) * gap) / numCols);

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {items.map((item) => (
          <ContentCard key={`${title}-${item.id}`} item={item} compact={false} fixedWidth={cardWidth} variant={cardVariant} onPress={() => onPressItem(item)} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ marginHorizontal: -device.contentGutter }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingLeft: device.contentGutter, paddingRight: device.contentGutter + 8 }}>
        {items.map((item) => (
          <ContentCard key={`${title}-${item.id}`} item={item} compact={isCompact} variant={cardVariant} onPress={() => onPressItem(item)} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── ContentRail ──────────────────────────────────────────────────────────────

type ContentRailProps = {
  title: string;
  subtitle?: string;
  items: FeedCardItem[];
  onPressItem: (_item: FeedCardItem) => void;
  onMorePress?: (_item: FeedCardItem) => void;
  actionLabel?: string;
  onAction?: () => void;
  onActionPress?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  loading?: boolean;
  compact?: boolean;
  hideWhenEmpty?: boolean;
  cardVariant?: CardVariant;
};

export function ContentRail({
  title, subtitle, items, onPressItem,
  actionLabel, onAction, onActionPress,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Try another section or search for something.',
  loading = false, compact, hideWhenEmpty = false, cardVariant = 'portrait',
}: ContentRailProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact      = compact ?? width < 430;
  const resolvedAction = onAction ?? onActionPress;

  return (
    <View style={styles.railGap}>
      {title ? (
        <View style={styles.railHeader}>
          <View style={styles.railTitleWrap}>
            <CustomText variant="heading" style={styles.railTitle} numberOfLines={1}>{title}</CustomText>
            {subtitle ? <CustomText variant="body" style={styles.railSubtitle} numberOfLines={1}>{subtitle}</CustomText> : null}
          </View>
          {actionLabel && resolvedAction ? (
            <TVTouchable onPress={resolvedAction} showFocusBorder={false} style={styles.railActionBtn}>
              <CustomText style={styles.railActionText}>{actionLabel}</CustomText>
              <MaterialIcons name="chevron-right" size={15} color={theme.colors.primary} />
            </TVTouchable>
          ) : null}
        </View>
      ) : null}

      {loading ? <RailSkeleton />
        : items.length > 0 ? <ContentRailInner items={items} title={title} onPressItem={onPressItem} isCompact={isCompact} cardVariant={cardVariant} />
        : hideWhenEmpty ? null : <InlineEmpty title={emptyTitle} message={emptyMessage} />}
    </View>
  );
}

// ─── ContentList ──────────────────────────────────────────────────────────────

export function ContentList({ title, items, onPressItem, onMorePress }: {
  title: string;
  items: FeedCardItem[];
  onPressItem: (_item: FeedCardItem) => void;
  onMorePress?: (_item: FeedCardItem) => void;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  if (!items.length) return null;

  const useGrid  = device.isDesktop || device.isTV;
  const numCols  = device.isTV ? 3 : 2;
  const maxItems = useGrid ? 12 : 10;

  return (
    <FadeIn delay={120}>
      <View>
        <CustomText variant="title" style={styles.listTitle}>{title}</CustomText>
        <View style={useGrid ? { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } : { gap: 0 }}>
          {items.slice(0, maxItems).map((item, index) => (
            <TVTouchable
              key={`${title}-${item.id}`}
              onPress={() => onPressItem(item)}
              showFocusBorder={false}
              style={useGrid ? { width: `${Math.floor(100 / numCols) - 1}%` } : undefined}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: useGrid ? 10 : 9,
                borderTopWidth: useGrid ? 0 : (index === 0 ? 0 : 1),
                borderTopColor: theme.colors.border,
                borderRadius: useGrid ? theme.radius.md : 0,
                backgroundColor: useGrid ? theme.colors.subtleFill : 'transparent',
                paddingHorizontal: useGrid ? 10 : 0,
              }}>
                <View style={[styles.listItemThumb, { width: useGrid ? 100 : 120, height: useGrid ? 58 : 68 }]}>
                  <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={styles.listItemImg} />
                  {isValidDuration(item.duration) ? (
                    <View style={styles.listDuration}>
                      <CustomText style={styles.listDurationText}>{item.duration}</CustomText>
                    </View>
                  ) : null}
                </View>
                <View style={common.flex1}>
                  <CustomText variant="label" style={styles.listItemTitle} numberOfLines={2}>{cleanFeedText(item.title)}</CustomText>
                  <CustomText variant="caption" style={styles.listItemSubtitle} numberOfLines={1}>{cleanFeedText(item.subtitle)}</CustomText>
                </View>
                {onMorePress
                  ? <TVTouchable onPress={() => onMorePress(item)} showFocusBorder={false}><MaterialIcons name="more-vert" size={18} color={theme.colors.textMuted} /></TVTouchable>
                  : <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />}
              </View>
            </TVTouchable>
          ))}
        </View>
      </View>
    </FadeIn>
  );
}

// ─── CompactContentRow ────────────────────────────────────────────────────────

export function CompactContentRow({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.compactRow}>
        <View style={styles.compactThumb}>
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={common.imgCover} />
        </View>
        <View style={common.flex1}>
          <CustomText variant="label" style={styles.compactTitle} numberOfLines={1}>{item.title}</CustomText>
          <CustomText variant="caption" style={styles.compactSubtitle} numberOfLines={1}>{formatFeedMeta(item)}</CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, icon = 'auto-awesome', actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <FadeIn delay={60}>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
        </View>
        <CustomText variant="title" style={styles.emptyTitle}>{title}</CustomText>
        <CustomText variant="body" style={styles.emptyMessage} numberOfLines={3}>{message}</CustomText>
        {actionLabel && onAction ? (
          <AppButton title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 20 }} />
        ) : null}
      </View>
    </FadeIn>
  );
}

// ─── BackToHomeButton ─────────────────────────────────────────────────────────

export function BackToHomeButton() {
  const router = useRouter();
  const theme  = useAppTheme();
  return (
    <AppButton
      title="Home"
      variant="secondary"
      size="sm"
      onPress={() => router.push('/(tabs)/home' as never)}
      leftIcon={<MaterialIcons name="home-filled" size={15} color={theme.colors.text} />}
    />
  );
}

// ─── TrendingList ─────────────────────────────────────────────────────────────

type TrendingListProps = {
  title: string;
  items: FeedCardItem[];
  onPressItem: (_item: FeedCardItem) => void;
  actionLabel?: string;
  onAction?: () => void;
};

export function TrendingList({ title, items, onPressItem, actionLabel, onAction }: TrendingListProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  if (!items.length) return null;

  return (
    <FadeIn delay={100}>
      <View style={{ gap: 12 }}>
        <View style={styles.trendingHeader}>
          <CustomText variant="title" style={styles.trendingTitle}>{title}</CustomText>
          {actionLabel && onAction ? (
            <TVTouchable onPress={onAction} showFocusBorder={false} style={styles.trendingActionBtn}>
              <CustomText variant="caption" style={styles.trendingActionText}>{actionLabel}</CustomText>
              <MaterialIcons name="chevron-right" size={14} color={theme.colors.primary} />
            </TVTouchable>
          ) : null}
        </View>

        <View>
          {items.slice(0, 10).map((item, index) => {
            const rank   = index + 1;
            const isTop3 = rank <= 3;
            return (
              <TVTouchable key={`trending-${item.id}`} onPress={() => onPressItem(item)} showFocusBorder={false}>
                <View style={[styles.trendingRow, index === 0 && styles.trendingFirstRow]}>
                  <CustomText variant="display" style={{
                    width: 30,
                    color: isTop3 ? theme.colors.primary : theme.colors.textMuted,
                    fontSize: isTop3 ? 22 : 18,
                    fontWeight: '800', textAlign: 'center',
                  }}>
                    {rank}
                  </CustomText>
                  <View style={styles.trendingArtwork}>
                    <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={common.imgCover} />
                  </View>
                  <View style={common.flex1}>
                    <CustomText variant="label" style={styles.trendingItemTitle} numberOfLines={1}>{cleanFeedText(item.title)}</CustomText>
                    <CustomText variant="caption" style={styles.trendingItemSubtitle} numberOfLines={1}>
                      {[cleanFeedText(item.subtitle), isValidDuration(item.duration) ? item.duration : null].filter(Boolean).join(' · ')}
                    </CustomText>
                  </View>
                  <View style={styles.trendingPlayBtn}>
                    <MaterialIcons name="play-arrow" size={18} color={theme.colors.primary} />
                  </View>
                </View>
              </TVTouchable>
            );
          })}
        </View>
      </View>
    </FadeIn>
  );
}

// ─── FeaturedSectionCard ──────────────────────────────────────────────────────

type FeaturedSectionCardProps = {
  sectionTitle: string;
  item: FeedCardItem | null;
  onPress: () => void;
  onSeeAll: () => void;
  loading?: boolean;
  actionLabel?: string;
};

export function FeaturedSectionCard({ sectionTitle, item, onPress, onSeeAll, loading = false, actionLabel = 'See all' }: FeaturedSectionCardProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const { width } = useWindowDimensions();
  const compact    = width < 430;
  const cardHeight = device.isTV ? 340 : device.isLargeDesktop ? 300 : device.isDesktop ? 260 : compact ? 210 : 230;

  if (loading) {
    return (
      <View style={{ gap: 14 }}>
        <View style={styles.featuredHeader}>
          <SkeletonLoader width={140} height={22} borderRadius={8} />
          <SkeletonLoader width={56} height={16} borderRadius={8} />
        </View>
        <SkeletonLoader width="100%" height={cardHeight} borderRadius={16} />
      </View>
    );
  }

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isLive  = item.isLive;
  const playLabel = isLive ? 'Watch live' : isVideo ? 'Watch' : 'Play';
  const playIcon: React.ComponentProps<typeof MaterialIcons>['name'] = isLive ? 'live-tv' : 'play-arrow';

  return (
    <FadeIn>
      <View style={{ gap: 14 }}>
        <View style={styles.featuredHeader}>
          <CustomText style={{ color: theme.colors.text, fontSize: compact ? 18 : 20, fontWeight: '800', letterSpacing: -0.5 }} numberOfLines={1}>
            {sectionTitle}
          </CustomText>
          <TVTouchable onPress={onSeeAll} showFocusBorder={false} style={styles.featuredActionBtn}>
            <CustomText style={styles.featuredActionText}>{actionLabel}</CustomText>
            <MaterialIcons name="chevron-right" size={15} color={theme.colors.primary} />
          </TVTouchable>
        </View>

        <TVTouchable onPress={onPress} showFocusBorder={false}>
          <View style={[styles.featuredCardShell, { height: cardHeight }]}>
            <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(cardHeight * 0.6) }} />

            {isLive ? (
              <View style={[styles.featuredLiveBadge, { backgroundColor: theme.colors.danger }]}>
                <View style={styles.featuredLiveDot} />
                <CustomText style={styles.featuredLiveText}>LIVE</CustomText>
              </View>
            ) : null}

            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: compact ? 14 : 18, gap: 8 }}>
              <CustomText style={{ color: '#FFFFFF', fontSize: compact ? 15 : 17, fontWeight: '700', letterSpacing: -0.3, lineHeight: compact ? 21 : 24 }} numberOfLines={2}>
                {cleanFeedText(item.title)}
              </CustomText>
              <View style={styles.featuredPlayRow}>
                <View style={[styles.featuredPlayBtn, { backgroundColor: isLive ? theme.colors.danger : theme.colors.primary }]}>
                  <MaterialIcons name={playIcon} size={15} color="#fff" />
                  <CustomText style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{playLabel}</CustomText>
                </View>
                {isValidDuration(item.duration) && !isLive ? <CustomText style={styles.featuredSubText}>{item.duration}</CustomText> : null}
                {item.subtitle ? <CustomText style={[styles.featuredSubText, { flex: 1 }]} numberOfLines={1}>{cleanFeedText(item.subtitle)}</CustomText> : null}
              </View>
            </View>
          </View>
        </TVTouchable>
      </View>
    </FadeIn>
  );
}

// ─── StreamingBanner ──────────────────────────────────────────────────────────

type StreamingBannerProps = {
  item?: FeedCardItem | null;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
};

export function StreamingBanner({ item, badge = 'Featured', title, subtitle, ctaLabel = 'Play now', onPress }: StreamingBannerProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const artSize = compact ? 96 : 110;
  const displayTitle    = title ?? cleanFeedText(item?.title) ?? 'Now Streaming';
  const displaySubtitle = subtitle ?? item?.description ?? 'Worship music, messages & live ministry';

  return (
    <FadeIn delay={60}>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <View style={styles.streamingCard}>
          <View style={styles.streamingInner}>
            <View style={{ flex: 1, padding: compact ? 14 : 18, justifyContent: 'center', gap: 6 }}>
              <View style={styles.streamingBadge}>
                <CustomText style={styles.streamingBadgeText}>{badge.toUpperCase()}</CustomText>
              </View>
              <CustomText variant="title" style={{ color: theme.colors.text, fontSize: compact ? 15 : 16.5, fontWeight: '800', letterSpacing: -0.3 }} numberOfLines={2}>
                {displayTitle}
              </CustomText>
              <CustomText variant="caption" style={styles.streamingSubtitle} numberOfLines={2}>{displaySubtitle}</CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={styles.streamingCtaBtn}>
                  <MaterialIcons name="play-arrow" size={15} color={theme.colors.textInverse} />
                  <CustomText style={styles.streamingCtaText}>{ctaLabel}</CustomText>
                </View>
              </View>
            </View>
            <View style={{ width: artSize, position: 'relative', flexShrink: 0 }}>
              <Image source={item?.imageUrl ? { uri: item.imageUrl } : BRAND_MUSIC_ASSET} resizeMode="cover" style={{ width: artSize, height: '100%' }} />
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}

// ─── GreetingBanner ───────────────────────────────────────────────────────────

export function GreetingBanner({ name }: { name?: string | null; newCount?: number }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const hour   = new Date().getHours();
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = name ? name.split(' ')[0] : null;
  const dateStr   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <FadeIn>
      <View style={styles.greetingRow}>
        <View style={styles.greetingLeft}>
          <CustomText style={styles.greetingTitle} numberOfLines={1}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </CustomText>
          <CustomText style={styles.greetingDate}>{dateStr}</CustomText>
        </View>
        <TVTouchable onPress={() => router.push(APP_ROUTES.profile as never)} showFocusBorder={false} style={styles.greetingNotifBtn}>
          <MaterialIcons name="notifications-none" size={20} color={theme.colors.text} />
        </TVTouchable>
      </View>
    </FadeIn>
  );
}

// ─── ContentShortcuts ─────────────────────────────────────────────────────────

export type ContentShortcut = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  onPress: () => void;
};

export function ContentShortcuts({ shortcuts }: { shortcuts: ContentShortcut[] }) {
  const styles = useStyles();

  return (
    <FadeIn delay={40}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2, paddingRight: 4 }}>
        {shortcuts.map((item) => (
          <TVTouchable key={item.id} onPress={item.onPress} showFocusBorder={false}>
            <View style={styles.shortcutItem}>
              <View style={{ width: 60, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${item.color}14`, borderWidth: 1, borderColor: `${item.color}28` }}>
                <MaterialIcons name={item.icon} size={26} color={item.color} />
              </View>
              <CustomText style={styles.shortcutLabel} numberOfLines={1}>{item.label}</CustomText>
            </View>
          </TVTouchable>
        ))}
      </ScrollView>
    </FadeIn>
  );
}

// ─── LiveNowBanner ────────────────────────────────────────────────────────────

export function LiveNowBanner({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;

  return (
    <FadeIn delay={40}>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <View style={styles.liveCard}>
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={styles.liveBgImage} />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: compact ? 16 : 20, gap: 16 }}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
            </View>
            <View style={common.flex1}>
              <CustomText style={styles.liveLabel}>Live now</CustomText>
              <CustomText variant="title" style={[styles.liveItemTitle, { fontSize: compact ? 15.5 : 17 }]} numberOfLines={1}>{item.title}</CustomText>
              {item.subtitle ? <CustomText variant="caption" style={styles.liveItemSubtitle} numberOfLines={1}>{item.subtitle}</CustomText> : null}
            </View>
            <View style={styles.liveJoinBtn}>
              <MaterialIcons name="live-tv" size={14} color={theme.colors.onPrimary} />
              <CustomText style={styles.liveJoinText}>Join</CustomText>
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}

// ─── WordOfDayCard ────────────────────────────────────────────────────────────

type WordOfDayData = {
  title?: string | null;
  passage?: string | null;
  verse?: string | null;
  reflection?: string | null;
};

export function WordOfDayCard({ word, onPress }: { word: WordOfDayData; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <FadeIn delay={80}>
      <TVTouchable onPress={onPress} showFocusBorder={false}>
        <View style={styles.wordCard}>
          <View style={styles.wordAccentBar} />
          <View style={styles.wordContent}>
            <View style={styles.wordLabelRow}>
              <MaterialIcons name="auto-stories" size={14} color={theme.colors.warning} />
              <CustomText variant="caption" style={styles.wordLabel}>Word for today</CustomText>
            </View>
            <CustomText variant="title" style={styles.wordTitle} numberOfLines={2}>{word.title ?? word.passage}</CustomText>
            {(word.verse ?? word.reflection) ? (
              <CustomText variant="body" style={styles.wordBody} numberOfLines={3}>{word.verse ?? word.reflection}</CustomText>
            ) : null}
            <View style={styles.wordReadMore}>
              <CustomText variant="caption" style={styles.wordReadMoreText}>Read full message</CustomText>
              <MaterialIcons name="arrow-forward" size={13} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({ title, accent: _accent, subtitle, actionLabel, onAction }: {
  title: string;
  accent?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <View>
      <View style={styles.sectionLabelRow}>
        <CustomText variant="heading" style={styles.sectionLabelTitle} numberOfLines={1}>{title}</CustomText>
        {actionLabel && onAction ? (
          <TVTouchable onPress={onAction} showFocusBorder={false} style={styles.sectionActionBtn}>
            <CustomText style={styles.sectionActionText}>{actionLabel}</CustomText>
            <MaterialIcons name="chevron-right" size={15} color={theme.colors.primary} />
          </TVTouchable>
        ) : null}
      </View>
      {subtitle ? (
        <CustomText variant="body" style={styles.sectionSubtitle} numberOfLines={1}>{subtitle}</CustomText>
      ) : null}
    </View>
  );
}
