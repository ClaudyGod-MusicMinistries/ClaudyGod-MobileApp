import React from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
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
import { SurfaceCard } from '../ui/SurfaceCard';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';

export type QuickAction = {
  label: string;
  hint?: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
};

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

export function dedupeFeedItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];
  for (const item of items) {
    const key = item.mediaUrl && item.mediaUrl.trim().length > 0 ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function formatFeedMeta(item: FeedCardItem) {
  return [cleanFeedText(item.subtitle), item.duration].filter((value) => Boolean(value)).join(' · ');
}

function cleanFeedText(value?: string | null): string {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function getFeaturedItem(...groups: (FeedCardItem[] | null | undefined)[]) {
  for (const group of groups) {
    const item = group?.find((entry) => entry && entry.title);
    if (item) return item;
  }
  return null;
}

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
  const isWide = width >= 840;
  const showBack = title !== 'ClaudyGod' && router.canGoBack();
  return (
    <TabScreenWrapper backgroundImage={backgroundImage} backgroundHeight={isWide ? 310 : 230}>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        bounces={Boolean(onRefresh)}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap }}>
            <FadeIn>
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor:
                    theme.scheme === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.08)',
                  backgroundColor:
                    theme.scheme === 'dark'
                      ? 'rgba(7,5,12,0.64)'
                      : 'rgba(255,255,255,0.82)',
                  paddingVertical: compact ? 8 : 9,
                  paddingHorizontal: compact ? 10 : 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: theme.scheme === 'dark' ? 0.18 : 0.08,
                  shadowRadius: 22,
                  elevation: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: compact ? 8 : 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <TVTouchable
                      onPress={() => (showBack ? router.back() : router.push(APP_ROUTES.tabs.home))}
                      showFocusBorder={false}
                      accessibilityRole="button"
                      accessibilityLabel={showBack ? 'Go back' : 'Go home'}
                      style={{
                        width: compact ? 32 : 36,
                        height: compact ? 32 : 36,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: showBack
                          ? theme.scheme === 'dark'
                            ? 'rgba(255,255,255,0.10)'
                            : 'rgba(17,10,31,0.08)'
                          : theme.colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: showBack ? theme.colors.border : 'transparent',
                        overflow: 'hidden',
                      }}
                    >
                      {showBack ? (
                        <MaterialIcons name="arrow-back-ios-new" size={17} color={theme.colors.text} />
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
                          fontSize: compact ? 15.5 : 17,
                          lineHeight: compact ? 21 : 22,
                        }}
                        numberOfLines={1}
                      >
                        {title}
                      </CustomText>

                      {subtitle && !compact && title !== 'ClaudyGod' ? (
                        <CustomText
                          variant="caption"
                          style={{ color: theme.colors.textSecondary, marginTop: 3, maxWidth: 720 }}
                          numberOfLines={1}
                        >
                          {subtitle}
                        </CustomText>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {rightAction ? <View>{rightAction}</View> : null}
                    <AppButton
                      title=""
                      variant="secondary"
                      size="sm"
                      onPress={() => router.push(APP_ROUTES.tabs.search)}
                      leftIcon={<MaterialIcons name="search" size={16} color={theme.colors.text} />}
                      style={{ minWidth: 40, paddingHorizontal: 10 }}
                    />
                    <AppButton
                      title=""
                      variant={isAuthenticated ? 'secondary' : 'primary'}
                      size="sm"
                      onPress={() => router.push(isAuthenticated ? APP_ROUTES.profile : APP_ROUTES.auth.signIn)}
                      leftIcon={
                        <MaterialIcons
                          name={isAuthenticated ? 'person-outline' : 'login'}
                          size={16}
                          color={isAuthenticated ? theme.colors.text : theme.colors.textInverse}
                        />
                      }
                      style={{ minWidth: 40, paddingHorizontal: 10 }}
                    />
                    <AppButton
                      title=""
                      variant="secondary"
                      size="sm"
                      onPress={() => router.push(APP_ROUTES.tabs.settings)}
                      leftIcon={<MaterialIcons name="keyboard-arrow-down" size={18} color={theme.colors.text} />}
                      style={{ minWidth: 38, paddingHorizontal: 9 }}
                    />
                  </View>
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

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, icon = 'auto-awesome', actionLabel, onAction }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
          borderWidth: 1,
          borderColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.22)' : 'rgba(124,58,237,0.14)',
        }}
      >
        <MaterialIcons name={icon} size={21} color={theme.colors.primary} />
      </View>

      <CustomText variant="title" style={{ color: theme.colors.text, textAlign: 'center', marginTop: 12 }}>
        {title}
      </CustomText>

      <CustomText
        variant="caption"
        style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 5, maxWidth: 380 }}
      >
        {message}
      </CustomText>

      {actionLabel && onAction ? (
        <AppButton title={actionLabel} onPress={onAction} size="md" style={{ marginTop: 14, alignSelf: 'center' }} />
      ) : null}
    </SurfaceCard>
  );
}

function InlineEmptyState({
  title,
  message,
  icon = 'auto-awesome',
}: {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        minHeight: 74,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(17,10,31,0.035)',
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.10)' : 'rgba(124,58,237,0.08)',
        }}
      >
        <MaterialIcons name={icon} size={17} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }} numberOfLines={2}>
          {message}
        </CustomText>
      </View>
    </View>
  );
}

function RailSkeleton({ compact }: { compact: boolean }) {
  const theme = useAppTheme();
  const width = compact ? 138 : 162;
  const imageHeight = compact ? 124 : 148;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11, paddingRight: 6 }}>
      {[0, 1, 2].map((item) => (
        <SurfaceCard key={item} tone="subtle" style={{ width, overflow: 'hidden' }}>
          <View style={{ height: imageHeight, backgroundColor: theme.colors.surfaceAlt }} />
          <View style={{ padding: 10, gap: 7 }}>
            <View style={{ height: 12, width: '82%', borderRadius: 999, backgroundColor: theme.colors.surfaceAlt }} />
            <View style={{ height: 10, width: '58%', borderRadius: 999, backgroundColor: theme.colors.surfaceAlt }} />
          </View>
        </SurfaceCard>
      ))}
    </ScrollView>
  );
}

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const itemWidth = compact ? '48.5%' : width >= 900 ? '23.5%' : '48%';
  const actionCards = actions.map((action) => (
    <TVTouchable
      key={action.label}
      onPress={action.onPress}
      style={{ width: compact ? 154 : itemWidth }}
      showFocusBorder={false}
    >
      <SurfaceCard
        tone="subtle"
        style={{
          minHeight: compact ? 54 : 64,
          paddingHorizontal: compact ? 10 : 11,
          paddingVertical: compact ? 9 : 10,
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : 10 }}>
          <View
            style={{
              width: compact ? 30 : 32,
              height: compact ? 30 : 32,
              borderRadius: compact ? 15 : 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
            }}
          >
            <MaterialIcons name={action.icon} size={17} color={theme.colors.primary} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
              {action.label}
            </CustomText>
            {action.hint ? (
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
                {action.hint}
              </CustomText>
            ) : null}
          </View>
        </View>
      </SurfaceCard>
    </TVTouchable>
  ));

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 6 }}
      >
        {actionCards}
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {actionCards}
    </View>
  );
}

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
  const heroHeight = height ?? (isWide ? 248 : 264);
  const imageUrl = item?.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const primaryAction = onPrimary ?? onPrimaryPress;
  const secondaryAction = onSecondary ?? onSecondaryPress;
  const resolvedPrimaryLabel = primaryLabel ?? actionLabel ?? 'Play now';

  return (
    <SurfaceCard tone="strong" style={{ overflow: 'hidden' }}>
      <View style={{ height: heroHeight }}>
        <Image
          source={item ? { uri: imageUrl } : BRAND_HERO_ASSET}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />
        <LinearGradient
          colors={
            theme.scheme === 'dark'
              ? ['rgba(5,4,10,0.34)', 'rgba(5,4,10,0.76)', 'rgba(5,4,10,0.98)']
              : ['rgba(6,4,12,0.28)', 'rgba(6,4,12,0.64)', 'rgba(6,4,12,0.90)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: isWide ? 1 : 0, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', padding: isWide ? theme.spacing.lg : theme.spacing.md }}
        >
          <View style={{ maxWidth: isWide ? 560 : undefined }}>
            <View
              style={{
                alignSelf: 'flex-start',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.30)',
                backgroundColor: 'rgba(0,0,0,0.56)',
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginBottom: 9,
              }}
            >
              <CustomText variant="meta" style={{ color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.2 }}>
                {item?.isLive ? 'Live now' : eyebrow ?? (item?.type === 'video' ? 'Featured video' : 'Featured')}
              </CustomText>
            </View>

            <CustomText variant="display" style={{ color: '#FFFFFF', fontSize: isWide ? 20 : 18, lineHeight: isWide ? 26 : 24, textShadowColor: 'rgba(0,0,0,0.36)', textShadowRadius: 10 }} numberOfLines={2}>
              {item?.title || title || 'Welcome to ClaudyGod'}
            </CustomText>

            <CustomText
              variant="subtitle"
              style={{ color: 'rgba(255,255,255,0.84)', marginTop: 6, maxWidth: 520 }}
              numberOfLines={3}
            >
              {item?.description || subtitle || 'Worship, messages, live ministry, and videos in one focused experience.'}
            </CustomText>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {primaryAction ? (
                <AppButton
                  title={resolvedPrimaryLabel}
                  onPress={primaryAction}
                  size="sm"
                  leftIcon={<MaterialIcons name={primaryIcon} size={17} color={theme.colors.textInverse} />}
                  style={{ flex: 1, alignSelf: 'stretch' }}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="sm"
                  onPress={secondaryAction}
                  textColor="#FFFFFF"
                  leftIcon={<MaterialIcons name={secondaryIcon} size={17} color="#FFFFFF" />}
                  style={{
                    flex: 1,
                    alignSelf: 'stretch',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    borderColor: 'rgba(255,255,255,0.24)',
                  }}
                />
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </View>
    </SurfaceCard>
  );
}

type ContentCardProps = {
  item: FeedCardItem;
  onPress: () => void;
  compact?: boolean;
};

export function ContentCard({ item, onPress, compact = false }: ContentCardProps) {
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const width = compact ? Math.min(252, Math.max(218, screenWidth * 0.68)) : Math.min(286, Math.max(246, screenWidth * 0.32));
  const imageHeight = Math.round(width * 0.5625);
  const title = cleanFeedText(item.title);

  return (
    <TVTouchable onPress={onPress} style={{ width }} showFocusBorder={false}>
      <View style={{ gap: 8 }}>
        <View
          style={{
            height: imageHeight,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 74 }}
          />
          {item.duration ? (
            <View
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                borderRadius: 7,
                backgroundColor: 'rgba(0,0,0,0.78)',
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}
            >
              <CustomText variant="meta" style={{ color: '#FFFFFF', fontSize: 10 }}>
                {item.duration}
              </CustomText>
            </View>
          ) : null}
          <View style={{ position: 'absolute', left: 8, bottom: 8 }}>
            <MaterialIcons name={item.type === 'video' || item.type === 'live' ? 'smart-display' : 'play-arrow'} size={19} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 2 }}>
          <CustomText variant="label" style={{ color: theme.colors.text, lineHeight: 18 }} numberOfLines={2}>
            {title}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
            {cleanFeedText(item.subtitle)}
          </CustomText>
        </View>
      </View>
    </TVTouchable>
  );
}

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

export function ContentRail({
  title,
  subtitle,
  items,
  onPressItem,
  actionLabel,
  onAction,
  onActionPress,
  emptyTitle = 'No items here right now',
  emptyMessage = 'Try another section or search for something specific.',
  loading = false,
  compact,
  hideWhenEmpty = false,
}: ContentRailProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = compact ?? width < 430;
  const resolvedAction = onAction ?? onActionPress;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <CustomText variant="title" style={{ color: theme.colors.text }}>
            {title}
          </CustomText>
          {subtitle ? (
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
              {subtitle}
            </CustomText>
          ) : null}
        </View>

        {actionLabel && resolvedAction ? (
          <TVTouchable
            onPress={resolvedAction}
            showFocusBorder={false}
            style={{
              minHeight: 30,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              paddingHorizontal: 9,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(17,10,31,0.05)',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <CustomText variant="meta" style={{ color: theme.colors.primary }} numberOfLines={1}>
              {actionLabel}
            </CustomText>
            <MaterialIcons name="chevron-right" size={15} color={theme.colors.primary} />
          </TVTouchable>
        ) : null}
      </View>

      {loading ? (
        <RailSkeleton compact={isCompact} />
      ) : items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 8 }}>
          {items.map((item) => (
            <ContentCard key={`${title}-${item.id}`} item={item} compact={isCompact} onPress={() => onPressItem(item)} />
          ))}
        </ScrollView>
      ) : hideWhenEmpty ? null : (
        <InlineEmptyState title={emptyTitle} message={emptyMessage} icon="library-music" />
      )}
    </View>
  );
}

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
        <CustomText variant="title" style={{ color: theme.colors.text, marginBottom: 9 }}>
          {title}
        </CustomText>
        <View style={{ gap: 12 }}>
          {items.slice(0, 10).map((item) => (
            <TVTouchable
              key={`${title}-${item.id}`}
              onPress={() => onPressItem(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
              }}
              showFocusBorder={false}
            >
              <View style={{ width: 124, height: 70, borderRadius: 13, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt }}>
                <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                {item.duration ? (
                  <View style={{ position: 'absolute', right: 6, bottom: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.78)', paddingHorizontal: 6, paddingVertical: 2 }}>
                    <CustomText variant="meta" style={{ color: '#FFFFFF', fontSize: 9 }}>{item.duration}</CustomText>
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <CustomText variant="label" style={{ color: theme.colors.text, lineHeight: 18 }} numberOfLines={2}>{cleanFeedText(item.title)}</CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 5 }} numberOfLines={2}>{cleanFeedText(item.subtitle)}</CustomText>
              </View>
              {onMorePress ? (
                <TVTouchable onPress={() => onMorePress(item)} showFocusBorder={false}>
                  <MaterialIcons name="more-vert" size={19} color={theme.colors.textSecondary} />
                </TVTouchable>
              ) : (
                <MaterialIcons name="chevron-right" size={19} color={theme.colors.textSecondary} />
              )}
            </TVTouchable>
          ))}
        </View>
      </View>
    </FadeIn>
  );
}

export function CompactContentRow({ item, onPress }: { item: FeedCardItem; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <SurfaceCard tone="subtle" style={{ padding: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
            resizeMode="cover"
            style={{ width: 50, height: 50, borderRadius: 15, backgroundColor: theme.colors.surfaceAlt }}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
              {item.title}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {formatFeedMeta(item)}
            </CustomText>
          </View>
          <MaterialIcons name="chevron-right" size={19} color={theme.colors.textSecondary} />
        </View>
      </SurfaceCard>
    </TVTouchable>
  );
}

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
