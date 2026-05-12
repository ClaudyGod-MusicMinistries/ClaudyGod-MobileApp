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
import { useAppTheme } from '../../util/colorScheme';
import { BRAND_HERO_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
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
  return [item.subtitle, item.duration].filter((value) => Boolean(value)).join(' · ');
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
  eyebrow,
  rightAction,
  children,
  refreshing = false,
  onRefresh,
  backgroundImage,
  showFooter = true,
}: PremiumPageProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 840;

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
              <SurfaceCard tone="strong" style={{ paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {eyebrow ? (
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.primary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.72,
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {eyebrow}
                      </CustomText>
                    ) : null}

                    <CustomText variant="heading" style={{ color: theme.colors.text }} numberOfLines={1}>
                      {title}
                    </CustomText>

                    {subtitle ? (
                      <CustomText
                        variant="caption"
                        style={{ color: theme.colors.textSecondary, marginTop: 4, maxWidth: 720 }}
                        numberOfLines={2}
                      >
                        {subtitle}
                      </CustomText>
                    ) : null}
                  </View>

                  {rightAction ? <View style={{ flexShrink: 0 }}>{rightAction}</View> : null}
                </View>
              </SurfaceCard>
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
        <AppButton title={actionLabel} onPress={onAction} size="md" style={{ marginTop: 14 }} />
      ) : null}
    </SurfaceCard>
  );
}

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const itemWidth = compact ? '100%' : width >= 900 ? '23.5%' : '48%';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
      {actions.map((action) => (
        <TVTouchable key={action.label} onPress={action.onPress} style={{ width: itemWidth }} showFocusBorder={false}>
          <SurfaceCard
            tone="subtle"
            style={{
              minHeight: 88,
              padding: theme.spacing.md,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
              }}
            >
              <MaterialIcons name={action.icon} size={17} color={theme.colors.primary} />
            </View>

            <View style={{ marginTop: 10 }}>
              <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
                {action.label}
              </CustomText>
              {action.hint ? (
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }} numberOfLines={2}>
                  {action.hint}
                </CustomText>
              ) : null}
            </View>
          </SurfaceCard>
        </TVTouchable>
      ))}
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
  const heroHeight = height ?? (isWide ? 282 : 318);
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
              ? ['rgba(5,4,10,0.10)', 'rgba(5,4,10,0.58)', 'rgba(5,4,10,0.94)']
              : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.56)', 'rgba(255,255,255,0.96)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: isWide ? 1 : 0, y: 1 }}
          style={{ flex: 1, justifyContent: 'flex-end', padding: theme.spacing.lg }}
        >
          <View style={{ maxWidth: isWide ? 560 : undefined }}>
            <View
              style={{
                alignSelf: 'flex-start',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.20)',
                backgroundColor: 'rgba(0,0,0,0.22)',
                paddingHorizontal: 10,
                paddingVertical: 5,
                marginBottom: 9,
              }}
            >
              <CustomText variant="caption" style={{ color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                {item?.isLive ? 'Live now' : eyebrow ?? (item?.type === 'video' ? 'Featured video' : 'Featured')}
              </CustomText>
            </View>

            <CustomText variant="display" style={{ color: '#FFFFFF' }} numberOfLines={2}>
              {item?.title || title || 'Welcome to ClaudyGod'}
            </CustomText>

            <CustomText
              variant="caption"
              style={{ color: 'rgba(255,255,255,0.78)', marginTop: 7, maxWidth: 520 }}
              numberOfLines={3}
            >
              {item?.description || subtitle || 'Worship, messages, live ministry, and videos in one focused experience.'}
            </CustomText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
              {primaryAction ? (
                <AppButton
                  title={resolvedPrimaryLabel}
                  onPress={primaryAction}
                  size="md"
                  leftIcon={<MaterialIcons name={primaryIcon} size={17} color={theme.colors.textInverse} />}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="md"
                  onPress={secondaryAction}
                  leftIcon={<MaterialIcons name={secondaryIcon} size={17} color={theme.colors.text} />}
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
  const width = compact ? 138 : 162;
  const imageHeight = compact ? 124 : 148;

  return (
    <TVTouchable onPress={onPress} style={{ width }} showFocusBorder={false}>
      <SurfaceCard tone="subtle" style={{ overflow: 'hidden' }}>
        <View style={{ height: imageHeight, backgroundColor: theme.colors.surfaceAlt }}>
          <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.58)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 }}
          />
          <View
            style={{
              position: 'absolute',
              right: 9,
              bottom: 9,
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
            }}
          >
            <MaterialIcons name={item.type === 'video' || item.type === 'live' ? 'smart-display' : 'play-arrow'} size={15} color={theme.colors.textInverse} />
          </View>
        </View>

        <View style={{ padding: 10 }}>
          <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={2}>
            {item.title}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }} numberOfLines={1}>
            {formatFeedMeta(item)}
          </CustomText>
        </View>
      </SurfaceCard>
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
  compact?: boolean;
};

export function ContentRail({
  title,
  subtitle,
  items,
  onPressItem,
  actionLabel,
  onAction,
  onActionPress,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'New content will appear here when it is published.',
  compact,
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
          <TVTouchable onPress={resolvedAction} showFocusBorder={false}>
            <CustomText variant="label" style={{ color: theme.colors.primary }}>
              {actionLabel}
            </CustomText>
          </TVTouchable>
        ) : null}
      </View>

      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11, paddingRight: 6 }}>
          {items.map((item) => (
            <ContentCard key={`${title}-${item.id}`} item={item} compact={isCompact} onPress={() => onPressItem(item)} />
          ))}
        </ScrollView>
      ) : (
        <EmptyState title={emptyTitle} message={emptyMessage} icon="library-music" />
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
        <SurfaceCard tone="subtle" style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
          {items.slice(0, 10).map((item, index) => (
            <TVTouchable
              key={`${title}-${item.id}`}
              onPress={() => onPressItem(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 9,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border,
              }}
              showFocusBorder={false}
            >
              <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.surface }} />
              <View style={{ flex: 1 }}>
                <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>{item.title}</CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{formatFeedMeta(item)}</CustomText>
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
        </SurfaceCard>
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
