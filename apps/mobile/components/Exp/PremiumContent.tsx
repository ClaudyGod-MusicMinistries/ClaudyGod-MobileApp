import React from 'react';
import { Image, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from '../layout/TabScreenWrapper';
import { Screen } from '../layout/Screen';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { SectionHeader } from '../ui/SectionHeader';
import { SurfaceCard } from '../ui/SurfaceCard';
import { PosterCard } from '../ui/PosterCard';
import { MinimalPosterCard } from '../ui/MinimalPosterCard';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';

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
  children,
  refreshing,
  onRefresh,
  rightAction,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  rightAction?: React.ReactNode;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={Boolean(onRefresh)}
        overScrollMode="never"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined
        }
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <SurfaceCard tone="strong" style={{ padding: isTablet ? 22 : 18 }}>
                <LinearGradient
                  pointerEvents="none"
                  colors={theme.colors.gradient.hero as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    {eyebrow ? (
                      <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.82, marginBottom: 7 }} numberOfLines={1}>
                        {eyebrow}
                      </CustomText>
                    ) : null}
                    <CustomText variant="display" style={{ color: theme.colors.text }} numberOfLines={2}>{title}</CustomText>
                    <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8, maxWidth: 620 }} numberOfLines={3}>{subtitle}</CustomText>
                  </View>
                  {rightAction ? <View>{rightAction}</View> : null}
                </View>
              </SurfaceCard>
            </FadeIn>
            {children}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

export function PremiumHero({
  item,
  title,
  subtitle,
  eyebrow,
  primaryLabel = 'Play',
  primaryIcon = 'play-arrow',
  onPrimary,
  secondaryLabel,
  secondaryIcon = 'bookmark-border',
  onSecondary,
  height,
}: {
  item?: FeedCardItem | null;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  primaryLabel?: string;
  primaryIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onPrimary?: () => void;
  secondaryLabel?: string;
  secondaryIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onSecondary?: () => void;
  height?: number;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const heroHeight = height ?? (width >= 768 ? 420 : isCompact ? 330 : 360);
  const imageUrl = item?.imageUrl || DEFAULT_CONTENT_IMAGE_URI;

  return (
    <FadeIn delay={70}>
      <SurfaceCard tone="strong">
        <View style={{ height: heroHeight, overflow: 'hidden' }}>
          <Image source={{ uri: imageUrl }} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} />
          <LinearGradient colors={['rgba(8,5,15,0.12)', 'rgba(8,5,15,0.46)', 'rgba(8,5,15,0.96)']} locations={[0, 0.45, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
            <View style={{ alignSelf: 'flex-start', borderRadius: theme.radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: item?.isLive ? 'rgba(239,68,68,0.92)' : 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
              <CustomText variant="caption" style={{ color: '#FFFFFF', letterSpacing: 0.3 }}>{item?.isLive ? 'Live now' : eyebrow ?? item?.subtitle ?? 'Featured'}</CustomText>
            </View>
            <CustomText variant="hero" style={{ color: '#FFFFFF', marginTop: 12, maxWidth: 720 }} numberOfLines={2}>{title ?? item?.title ?? 'Welcome to ClaudyGod'}</CustomText>
            <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.72)', marginTop: 8, maxWidth: 650 }} numberOfLines={3}>{subtitle ?? item?.description ?? 'Music, worship, messages, and live moments in one calm place.'}</CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              {onPrimary ? <AppButton title={primaryLabel} onPress={onPrimary} leftIcon={<MaterialIcons name={primaryIcon} size={18} color={theme.colors.textInverse} />} /> : null}
              {secondaryLabel && onSecondary ? (
                <AppButton title={secondaryLabel} variant="secondary" onPress={onSecondary} textColor="#FFFFFF" leftIcon={<MaterialIcons name={secondaryIcon} size={18} color="#FFFFFF" />} style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.16)' }} />
              ) : null}
            </View>
          </View>
        </View>
      </SurfaceCard>
    </FadeIn>
  );
}

export function QuickActionGrid({ actions }: { actions: { label: string; hint?: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; onPress: () => void }[] }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : 2;
  return (
    <FadeIn delay={110}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {actions.map((action) => (
          <TVTouchable key={action.label} onPress={action.onPress} style={{ width: `${100 / columns}%`, flexGrow: 1, minWidth: columns === 4 ? 180 : 140, borderRadius: theme.radius.xl, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 14, gap: 10 }} showFocusBorder={false}>
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.13)' : 'rgba(124,58,237,0.09)' }}>
              <MaterialIcons name={action.icon} size={20} color={theme.colors.primary} />
            </View>
            <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>{action.label}</CustomText>
            {action.hint ? <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: -6 }} numberOfLines={2}>{action.hint}</CustomText> : null}
          </TVTouchable>
        ))}
      </View>
    </FadeIn>
  );
}

export function ContentRail({ title, items, onPressItem, onMorePress, actionLabel, onAction, compact }: { title: string; items: FeedCardItem[]; onPressItem: (_item: FeedCardItem) => void; onMorePress?: (_item: FeedCardItem) => void; actionLabel?: string; onAction?: () => void; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <FadeIn delay={140}>
      <View>
        <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
          {items.slice(0, 14).map((item) =>
            compact ? (
              <MinimalPosterCard key={`${title}-${item.id}`} imageUrl={item.imageUrl} title={item.title} meta={formatFeedMeta(item)} isLive={item.isLive} showMore={Boolean(onMorePress)} onMorePress={onMorePress ? () => onMorePress(item) : undefined} onPress={() => onPressItem(item)} />
            ) : (
              <PosterCard key={`${title}-${item.id}`} imageUrl={item.imageUrl} title={item.title} meta={formatFeedMeta(item)} isLive={item.isLive} showMore={Boolean(onMorePress)} onMorePress={onMorePress ? () => onMorePress(item) : undefined} onPress={() => onPressItem(item)} />
            ),
          )}
        </ScrollView>
      </View>
    </FadeIn>
  );
}

export function ContentList({ title, items, onPressItem, onMorePress }: { title: string; items: FeedCardItem[]; onPressItem: (_item: FeedCardItem) => void; onMorePress?: (_item: FeedCardItem) => void }) {
  const theme = useAppTheme();
  if (!items.length) return null;
  return (
    <FadeIn delay={160}>
      <View>
        <SectionHeader title={title} />
        <SurfaceCard tone="subtle" style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
          {items.slice(0, 8).map((item, index) => (
            <TVTouchable key={`${title}-${item.id}`} onPress={() => onPressItem(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: theme.colors.border }} showFocusBorder={false}>
              <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.colors.surface }} />
              <View style={{ flex: 1 }}>
                <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>{item.title}</CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }} numberOfLines={1}>{formatFeedMeta(item)}</CustomText>
              </View>
              {onMorePress ? <TVTouchable onPress={() => onMorePress(item)} showFocusBorder={false}><MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} /></TVTouchable> : <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />}
            </TVTouchable>
          ))}
        </SurfaceCard>
      </View>
    </FadeIn>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, icon = 'auto-awesome' }: { title: string; message: string; actionLabel?: string; onAction?: () => void; icon?: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  const theme = useAppTheme();
  return (
    <FadeIn delay={140}>
      <SurfaceCard tone="subtle" style={{ padding: 22, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.13)' : 'rgba(124,58,237,0.09)' }}>
          <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
        </View>
        <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 14, textAlign: 'center' }}>{title}</CustomText>
        <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center', maxWidth: 420 }}>{message}</CustomText>
        {actionLabel && onAction ? <AppButton title={actionLabel} onPress={onAction} style={{ marginTop: 16 }} /> : null}
      </SurfaceCard>
    </FadeIn>
  );
}
