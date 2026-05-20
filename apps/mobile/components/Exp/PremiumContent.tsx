import React from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
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
import { AppButton } from '../ui/AppButton';
import { AppScreenFooter } from '../layout/AppScreenFooter';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

export function formatFeedMeta(item: FeedCardItem) {
  return [cleanFeedText(item.subtitle), item.duration].filter(Boolean).join(' · ');
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

// ─── PremiumPage ─────────────────────────────────────────────────────────────────

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
}: PremiumPageProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const showBack = title !== 'ClaudyGod' && router.canGoBack();

  return (
    <TabScreenWrapper backgroundImage={backgroundImage} backgroundHeight={compact ? 240 : 320}>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        bounces={Boolean(onRefresh)}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap }}>
            {/* ── Top navigation bar ── */}
            <FadeIn>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: compact ? 8 : 10,
                  paddingVertical: compact ? 7 : 8,
                  paddingHorizontal: compact ? 10 : 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor:
                    theme.scheme === 'dark'
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(15,23,42,0.07)',
                  backgroundColor:
                    theme.scheme === 'dark'
                      ? 'rgba(7,5,12,0.72)'
                      : 'rgba(255,255,255,0.86)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: theme.scheme === 'dark' ? 0.22 : 0.07,
                  shadowRadius: 18,
                  elevation: 6,
                }}
              >
                {/* Left — back/logo + title */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
                >
                  <TVTouchable
                    onPress={() => (showBack ? router.back() : router.push(APP_ROUTES.tabs.home))}
                    showFocusBorder={false}
                    accessibilityRole="button"
                    accessibilityLabel={showBack ? 'Go back' : 'Go home'}
                    style={{
                      width: compact ? 34 : 38,
                      height: compact ? 34 : 38,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: showBack
                        ? theme.scheme === 'dark'
                          ? 'rgba(255,255,255,0.09)'
                          : 'rgba(17,10,31,0.07)'
                        : theme.colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: showBack ? theme.colors.border : 'transparent',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {showBack ? (
                      <MaterialIcons name="arrow-back-ios-new" size={16} color={theme.colors.text} />
                    ) : (
                      <Image
                        source={BRAND_LOGO_ASSET}
                        resizeMode="cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                  </TVTouchable>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <CustomText
                      variant="heading"
                      style={{
                        color: theme.colors.text,
                        fontSize: compact ? 15 : 16.5,
                        letterSpacing: -0.2,
                      }}
                      numberOfLines={1}
                    >
                      {title}
                    </CustomText>
                    {subtitle && !compact && title !== 'ClaudyGod' ? (
                      <CustomText
                        variant="caption"
                        style={{ color: theme.colors.textSecondary, marginTop: 2, maxWidth: 720 }}
                        numberOfLines={1}
                      >
                        {subtitle}
                      </CustomText>
                    ) : null}
                  </View>
                </View>

                {/* Right — icon actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {rightAction ? <View>{rightAction}</View> : null}

                  <NavIconButton
                    icon="search"
                    label="Search"
                    onPress={() => router.push(APP_ROUTES.tabs.search)}
                    size={compact ? 34 : 38}
                    scheme={theme.scheme}
                    borderColor={theme.colors.border}
                    iconColor={theme.colors.text}
                  />

                  <NavIconButton
                    icon={isAuthenticated ? 'person-outline' : 'login'}
                    label={isAuthenticated ? 'Profile' : 'Sign in'}
                    onPress={() =>
                      router.push(isAuthenticated ? APP_ROUTES.profile : APP_ROUTES.auth.signIn)
                    }
                    size={compact ? 34 : 38}
                    scheme={theme.scheme}
                    borderColor={isAuthenticated ? theme.colors.border : 'transparent'}
                    iconColor={isAuthenticated ? theme.colors.primary : theme.colors.textInverse}
                    accent={!isAuthenticated}
                    accentColor={theme.colors.primary}
                  />
                </View>
              </View>
            </FadeIn>

            {children}
            {showFooter ? <AppScreenFooter /> : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

// Small nav icon button used in the page header
function NavIconButton({
  icon,
  label,
  onPress,
  size,
  scheme,
  borderColor,
  iconColor,
  accent = false,
  accentColor,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  size: number;
  scheme: string;
  borderColor: string;
  iconColor: string;
  accent?: boolean;
  accentColor?: string;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: accent
          ? accentColor
          : scheme === 'dark'
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(17,10,31,0.06)',
        borderWidth: 1,
        borderColor,
      }}
    >
      <MaterialIcons name={icon} size={18} color={iconColor} />
    </TVTouchable>
  );
}

// ─── PremiumHero ─────────────────────────────────────────────────────────────────

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
  item,
  title,
  subtitle,
  eyebrow,
  actionLabel,
  primaryLabel,
  primaryIcon = 'play-arrow',
  secondaryLabel,
  secondaryIcon = 'search',
  onPrimaryPress,
  onPrimary,
  onSecondaryPress,
  onSecondary,
  height,
}: PremiumHeroProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const isLarge = width >= 1024;
  const heroHeight = height ?? (isLarge ? 380 : isWide ? 320 : 290);
  const imageUrl = item?.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const primaryAction = onPrimary ?? onPrimaryPress;
  const secondaryAction = onSecondary ?? onSecondaryPress;
  const resolvedPrimaryLabel = primaryLabel ?? actionLabel ?? 'Play now';
  const isLiveItem = item?.isLive;

  return (
    <View
      style={{
        height: heroHeight,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      }}
    >
      <Image
        source={item ? { uri: imageUrl } : BRAND_HERO_ASSET}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={
          isWide
            ? ['rgba(5,4,10,0.10)', 'rgba(5,4,10,0.50)', 'rgba(5,4,10,0.96)']
            : ['rgba(5,4,10,0.06)', 'rgba(5,4,10,0.60)', 'rgba(5,4,10,0.98)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: isWide ? 0.7 : 0, y: 1 }}
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          // pointerEvents: none via style (not deprecated prop)
          Platform.OS === 'web' ? { pointerEvents: 'none' } : {},
        ]}
      />

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: isWide ? 26 : 20 }}>
        <View style={{ maxWidth: isWide ? 580 : undefined }}>
          {/* Live / eyebrow badge */}
          {(isLiveItem || eyebrow || item) ? (
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isLiveItem ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.28)',
                backgroundColor: isLiveItem ? 'rgba(244,63,94,0.18)' : 'rgba(0,0,0,0.52)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginBottom: 10,
              }}
            >
              {isLiveItem ? (
                <View
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F43F5E' }}
                />
              ) : null}
              <Text
                style={{
                  color: isLiveItem ? '#F87171' : 'rgba(255,255,255,0.9)',
                  fontSize: 10,
                  fontWeight: '600',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                {isLiveItem
                  ? 'Live now'
                  : eyebrow ?? (item?.type === 'video' ? 'Featured video' : 'Featured')}
              </Text>
            </View>
          ) : null}

          {/* Title */}
          <CustomText
            variant="display"
            style={{
              color: '#FFFFFF',
              fontSize: isLarge ? 28 : isWide ? 23 : 20,
              lineHeight: isLarge ? 36 : isWide ? 30 : 27,
              fontWeight: '800',
              letterSpacing: -0.4,
            }}
            numberOfLines={2}
          >
            {item?.title || title || 'Welcome to ClaudyGod'}
          </CustomText>

          {/* Subtitle */}
          <CustomText
            variant="body"
            style={{ color: 'rgba(255,255,255,0.76)', marginTop: 6, maxWidth: 520, lineHeight: 20 }}
            numberOfLines={2}
          >
            {item?.description || subtitle || 'Worship, messages, live ministry, and videos.'}
          </CustomText>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {primaryAction ? (
              <AppButton
                title={resolvedPrimaryLabel}
                onPress={primaryAction}
                size="md"
                leftIcon={
                  <MaterialIcons name={primaryIcon} size={18} color={theme.colors.textInverse} />
                }
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
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderColor: 'rgba(255,255,255,0.22)',
                }}
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── QuickActionGrid ─────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  'graphic-eq':   '#B794F6',
  'smart-display': '#60A5FA',
  'live-tv':      '#F43F5E',
  search:         '#34D399',
  headphones:     '#B794F6',
  library:        '#FBBF24',
};

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 2, paddingVertical: 4 }}
      >
        {actions.map((action) => {
          const accent = ACTION_COLORS[action.icon] ?? theme.colors.primary;
          return (
            <TVTouchable key={action.label} onPress={action.onPress} showFocusBorder={false}>
              <View style={{ alignItems: 'center', gap: 8, width: 68 }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      theme.scheme === 'dark'
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(17,10,31,0.06)',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <MaterialIcons name={action.icon} size={26} color={accent} />
                </View>
                <CustomText
                  variant="caption"
                  style={{ color: theme.colors.text, fontSize: 11, fontWeight: '500', textAlign: 'center' }}
                  numberOfLines={1}
                >
                  {action.label}
                </CustomText>
              </View>
            </TVTouchable>
          );
        })}
      </ScrollView>
    );
  }

  // Wide layout: always flex: 1 per item so they fill the row evenly.
  // (flex: undefined on large screens caused the flex: 1 child View to collapse to 0 width)
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {actions.map((action) => {
        const accent = ACTION_COLORS[action.icon] ?? theme.colors.primary;
        return (
          <TVTouchable
            key={action.label}
            onPress={action.onPress}
            showFocusBorder={false}
            style={{ flex: 1 }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor:
                  theme.scheme === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(17,10,31,0.04)',
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${accent}1A`,
                }}
              >
                <MaterialIcons name={action.icon} size={20} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <CustomText
                  variant="label"
                  style={{ color: theme.colors.text, fontSize: 13.5, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {action.label}
                </CustomText>
                {action.hint ? (
                  <CustomText
                    variant="caption"
                    style={{ color: theme.colors.textMuted, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {action.hint}
                  </CustomText>
                ) : null}
              </View>
              <MaterialIcons name="chevron-right" size={16} color={theme.colors.textMuted} />
            </View>
          </TVTouchable>
        );
      })}
    </View>
  );
}

// ─── ContentCard ─────────────────────────────────────────────────────────────────

type ContentCardProps = {
  item: FeedCardItem;
  onPress: () => void;
  compact?: boolean;
};

export function ContentCard({ item, onPress, compact = false }: ContentCardProps) {
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 1024;
  const cardWidth = compact
    ? Math.min(154, Math.max(132, screenWidth * 0.38))
    : isDesktop
      ? Math.min(228, Math.max(192, screenWidth * 0.17))
      : Math.min(192, Math.max(160, screenWidth * 0.42));
  const title = cleanFeedText(item.title);

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false} style={{ width: cardWidth }}>
      <View style={{ gap: 8 }}>
        {/* Square artwork */}
        <View
          style={{
            width: cardWidth,
            height: cardWidth,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <Image
            source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Bottom scrim */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: cardWidth * 0.5 }}
          />

          {/* Type pill — bottom-left */}
          <View
            style={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.62)',
              paddingHorizontal: 7,
              paddingVertical: 3,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MaterialIcons
              name={
                item.type === 'video' || item.type === 'live' ? 'smart-display' : 'graphic-eq'
              }
              size={11}
              color="rgba(255,255,255,0.9)"
            />
            {item.isLive ? (
              <Text
                style={{ color: '#F87171', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 }}
              >
                LIVE
              </Text>
            ) : null}
          </View>

          {/* Duration — bottom-right */}
          {item.duration && !item.isLive ? (
            <View
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                borderRadius: 6,
                backgroundColor: 'rgba(0,0,0,0.70)',
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '500' }}>
                {item.duration}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Info below artwork */}
        <View style={{ gap: 3, paddingHorizontal: 2 }}>
          <CustomText
            variant="label"
            style={{ color: theme.colors.text, lineHeight: 18, fontWeight: '600' }}
            numberOfLines={2}
          >
            {title}
          </CustomText>
          <CustomText
            variant="caption"
            style={{ color: theme.colors.textSecondary }}
            numberOfLines={1}
          >
            {cleanFeedText(item.subtitle)}
          </CustomText>
        </View>
      </View>
    </TVTouchable>
  );
}

// ─── ContentRail ─────────────────────────────────────────────────────────────────

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
};

function RailSkeleton() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const isDesktop = width >= 1024;
  const cardWidth = compact ? 140 : isDesktop ? 210 : 172;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 6 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: cardWidth, gap: 8 }}>
          <View
            style={{
              width: cardWidth,
              height: cardWidth,
              borderRadius: 14,
              backgroundColor: theme.colors.surfaceAlt,
            }}
          />
          <View style={{ gap: 6, paddingHorizontal: 2 }}>
            <View
              style={{
                height: 12,
                width: '76%',
                borderRadius: 999,
                backgroundColor: theme.colors.surfaceAlt,
              }}
            />
            <View
              style={{
                height: 10,
                width: '50%',
                borderRadius: 999,
                backgroundColor: theme.colors.surfaceAlt,
              }}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function InlineEmpty({
  title,
  message,
  icon = 'library-music',
}: {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        minHeight: 72,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor:
          theme.scheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(17,10,31,0.03)',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            theme.scheme === 'dark' ? 'rgba(183,148,246,0.10)' : 'rgba(124,58,237,0.08)',
        }}
      >
        <MaterialIcons name={icon} size={17} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
          {title}
        </CustomText>
        <CustomText
          variant="caption"
          style={{ color: theme.colors.textSecondary, marginTop: 3 }}
          numberOfLines={2}
        >
          {message}
        </CustomText>
      </View>
    </View>
  );
}

export function ContentRail({
  title,
  subtitle,
  items,
  onPressItem,
  actionLabel,
  onAction,
  onActionPress,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Try another section or search for something.',
  loading = false,
  compact,
  hideWhenEmpty = false,
}: ContentRailProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = compact ?? width < 430;
  const resolvedAction = onAction ?? onActionPress;

  return (
    <View style={{ gap: 12 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText
            variant="title"
            style={{
              color: theme.colors.text,
              fontSize: isCompact ? 15 : 16.5,
              fontWeight: '700',
              letterSpacing: -0.2,
            }}
          >
            {title}
          </CustomText>
          {subtitle ? (
            <CustomText
              variant="caption"
              style={{ color: theme.colors.textMuted, marginTop: 3 }}
              numberOfLines={1}
            >
              {subtitle}
            </CustomText>
          ) : null}
        </View>

        {actionLabel && resolvedAction ? (
          <TVTouchable
            onPress={resolvedAction}
            showFocusBorder={false}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor:
                theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(17,10,31,0.05)',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <CustomText
              variant="caption"
              style={{ color: theme.colors.primary, fontSize: 11.5, fontWeight: '600' }}
            >
              {actionLabel}
            </CustomText>
            <MaterialIcons name="chevron-right" size={14} color={theme.colors.primary} />
          </TVTouchable>
        ) : null}
      </View>

      {/* Content area */}
      {loading ? (
        <RailSkeleton />
      ) : items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 8 }}
        >
          {items.map((item) => (
            <ContentCard
              key={`${title}-${item.id}`}
              item={item}
              compact={isCompact}
              onPress={() => onPressItem(item)}
            />
          ))}
        </ScrollView>
      ) : hideWhenEmpty ? null : (
        <InlineEmpty title={emptyTitle} message={emptyMessage} />
      )}
    </View>
  );
}

// ─── ContentList ──────────────────────────────────────────────────────────────────

export function ContentList({
  title,
  items,
  onPressItem,
  onMorePress,
}: {
  title: string;
  items: FeedCardItem[];
  onPressItem: (_item: FeedCardItem) => void;
  onMorePress?: (_item: FeedCardItem) => void;
}) {
  const theme = useAppTheme();
  if (!items.length) return null;

  return (
    <FadeIn delay={120}>
      <View>
        <CustomText
          variant="title"
          style={{ color: theme.colors.text, marginBottom: 12, fontWeight: '700', letterSpacing: -0.2 }}
        >
          {title}
        </CustomText>
        <View style={{ gap: 0 }}>
          {items.slice(0, 10).map((item, index) => (
            <TVTouchable
              key={`${title}-${item.id}`}
              onPress={() => onPressItem(item)}
              showFocusBorder={false}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 9,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <View
                  style={{
                    width: 118,
                    height: 66,
                    borderRadius: 11,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surfaceAlt,
                    flexShrink: 0,
                  }}
                >
                  <Image
                    source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                  {item.duration ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: 5,
                        bottom: 5,
                        borderRadius: 5,
                        backgroundColor: 'rgba(0,0,0,0.76)',
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 9 }}>{item.duration}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <CustomText
                    variant="label"
                    style={{ color: theme.colors.text, lineHeight: 18, fontWeight: '600' }}
                    numberOfLines={2}
                  >
                    {cleanFeedText(item.title)}
                  </CustomText>
                  <CustomText
                    variant="caption"
                    style={{ color: theme.colors.textSecondary, marginTop: 4 }}
                    numberOfLines={1}
                  >
                    {cleanFeedText(item.subtitle)}
                  </CustomText>
                </View>
                {onMorePress ? (
                  <TVTouchable onPress={() => onMorePress(item)} showFocusBorder={false}>
                    <MaterialIcons name="more-vert" size={18} color={theme.colors.textMuted} />
                  </TVTouchable>
                ) : (
                  <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
                )}
              </View>
            </TVTouchable>
          ))}
        </View>
      </View>
    </FadeIn>
  );
}

// ─── CompactContentRow ────────────────────────────────────────────────────────────

export function CompactContentRow({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAlt,
            flexShrink: 0,
          }}
        >
          <Image
            source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText
            variant="label"
            style={{ color: theme.colors.text, fontWeight: '600' }}
            numberOfLines={1}
          >
            {item.title}
          </CustomText>
          <CustomText
            variant="caption"
            style={{ color: theme.colors.textSecondary, marginTop: 3 }}
            numberOfLines={1}
          >
            {formatFeedMeta(item)}
          </CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────────

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  icon = 'auto-awesome',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 44,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor:
          theme.scheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(17,10,31,0.03)',
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
          borderWidth: 1,
          borderColor:
            theme.scheme === 'dark' ? 'rgba(183,148,246,0.22)' : 'rgba(124,58,237,0.14)',
          marginBottom: 16,
        }}
      >
        <MaterialIcons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <CustomText
        variant="title"
        style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '700', marginBottom: 8 }}
      >
        {title}
      </CustomText>
      <CustomText
        variant="caption"
        style={{
          color: theme.colors.textSecondary,
          textAlign: 'center',
          maxWidth: 340,
          lineHeight: 18,
        }}
      >
        {message}
      </CustomText>
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} onPress={onAction} size="md" style={{ marginTop: 20 }} />
      ) : null}
    </View>
  );
}

// ─── BackToHomeButton ──────────────────────────────────────────────────────────────

export function BackToHomeButton() {
  const router = useRouter();
  const theme = useAppTheme();
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
