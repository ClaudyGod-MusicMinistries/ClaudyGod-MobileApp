import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, Platform, ScrollView, View, useWindowDimensions } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { ContentCard } from './ContentCard';
import { getContentCardWidth, getContentCardHeight, CARD_TEXT_AREA_HEIGHT, type CardVariant } from './utils';

function keyExtractor(item: FeedCardItem) {
  return item.id;
}

function RailSkeleton({ cardVariant = 'portrait' }: { cardVariant?: CardVariant }) {
  const device = useDeviceClass();
  const compact   = device.width < 430;
  const cardWidth = getContentCardWidth(device, compact);
  const cardHeight = getContentCardHeight(cardWidth, cardVariant);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 20 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: cardWidth, gap: 10 }}>
          <SkeletonLoader width={cardWidth} height={cardHeight} borderRadius={20} />
          <View style={{ gap: 7, paddingHorizontal: 2 }}>
            <SkeletonLoader width="80%" height={14} borderRadius={999} />
            <SkeletonLoader width="52%" height={12} borderRadius={999} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function InlineEmpty({ title, message, icon = 'library-music' }: {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const styles = useFeedStyles();
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

// Delegates to ContentCard's own sizing formulas (via utils.ts) so the
// FlashList container is sized precisely — FlashList needs a bounded
// cross-axis size when horizontal, and any drift here reappears as dead
// space under the rail.
function railCardHeight(cardWidth: number, variant: CardVariant): number {
  return getContentCardHeight(cardWidth, variant) + CARD_TEXT_AREA_HEIGHT;
}

function ContentRailInner({ items, title, onPressItem, isCompact, cardVariant = 'portrait' }: {
  items: FeedCardItem[];
  title: string;
  onPressItem: (_item: FeedCardItem) => void;
  isCompact: boolean;
  cardVariant?: CardVariant;
}) {
  const device = useDeviceClass();
  const styles = useFeedStyles();
  const theme = useAppTheme();
  const mobileCardWidth = getContentCardWidth(device, isCompact);
  const listRef = useRef<FlashListRef<FeedCardItem>>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(0);
  const effectiveViewportWidth = Math.min(device.width - device.contentGutter * 2, device.maxContentWidth);
  const visibleCount = Math.max(
    1,
    Math.floor((effectiveViewportWidth + 16) / (mobileCardWidth + 16)),
  );
  const lastPageStart = Math.max(0, items.length - visibleCount);
  const itemIdentity = useMemo(() => items.map((item) => item.id).join('|'), [items]);

  useEffect(() => {
    setFirstVisibleIndex(0);
  }, [itemIdentity]);

  const onViewableItemsChanged = useCallback((event: { viewableItems: { index: number | null }[] }) => {
    const indexes = event.viewableItems
      .map((entry) => entry.index)
      .filter((index): index is number => typeof index === 'number');
    if (indexes.length) setFirstVisibleIndex(Math.min(...indexes));
  }, []);

  const movePage = useCallback((direction: -1 | 1) => {
    const target = Math.max(0, Math.min(lastPageStart, firstVisibleIndex + direction * visibleCount));
    setFirstVisibleIndex(target);
    if (Platform.OS === 'web' && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: target * (mobileCardWidth + 16),
        animated: true,
      });
    } else if (listRef.current) {
      void listRef.current.scrollToIndex({ index: target, animated: true }).catch(() => undefined);
    }
  }, [firstVisibleIndex, lastPageStart, mobileCardWidth, visibleCount]);

  const onWebScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (mobileCardWidth + 16));
    setFirstVisibleIndex(Math.max(0, Math.min(lastPageStart, index)));
  }, [lastPageStart, mobileCardWidth]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedCardItem>) => (
      <ContentCard item={item} compact={isCompact} fixedWidth={mobileCardWidth} variant={cardVariant} onPress={() => onPressItem(item)} />
    ),
    [isCompact, mobileCardWidth, cardVariant, onPressItem],
  );

  const cardHeight = getContentCardHeight(mobileCardWidth, cardVariant);
  const isLargeScreen = device.isDesktop || device.isTablet || device.isTV || Platform.OS === 'web';
  const showNavArrows = isLargeScreen && items.length > visibleCount;
  const arrowTop = Math.max(12, Math.round(cardHeight / 2) - 20);

  return (
    <View style={{ marginHorizontal: -device.contentGutter, position: 'relative' }}>
      <View style={{ height: railCardHeight(mobileCardWidth, cardVariant) }}>
        {Platform.OS === 'web' ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onWebScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingLeft: device.contentGutter,
              paddingRight: device.contentGutter + 8,
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            {items.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                compact={isCompact}
                fixedWidth={mobileCardWidth}
                variant={cardVariant}
                onPress={() => onPressItem(item)}
              />
            ))}
          </ScrollView>
        ) : (
          <FlashList
            ref={listRef}
            data={items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            contentContainerStyle={{ paddingLeft: device.contentGutter, paddingRight: device.contentGutter + 8 }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 55 }}
          />
        )}
      </View>

      {/* Floating navigation controls for Desktop, Tablet, Web, and Large Screens */}
      {showNavArrows && firstVisibleIndex > 0 ? (
        <TVTouchable
          onPress={() => movePage(-1)}
          showFocusBorder={false}
          style={[
            styles.railFloatingNavBtn,
            { left: device.contentGutter + 6, top: arrowTop },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Previous ${title || 'content'} items`}
        >
          <MaterialIcons name="chevron-left" size={24} color={theme.colors.text} />
        </TVTouchable>
      ) : null}

      {showNavArrows && firstVisibleIndex < lastPageStart ? (
        <TVTouchable
          onPress={() => movePage(1)}
          showFocusBorder={false}
          style={[
            styles.railFloatingNavBtn,
            { right: device.contentGutter + 6, top: arrowTop },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Next ${title || 'content'} items`}
        >
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text} />
        </TVTouchable>
      ) : null}

      {device.isTV && items.length > visibleCount ? (
        <View style={styles.railPaginationOverlay}>
          <CustomText variant="caption" style={styles.railPaginationText} accessibilityLiveRegion="polite">
            {Math.min(firstVisibleIndex + 1, lastPageStart + 1)}–{Math.min(items.length, firstVisibleIndex + visibleCount)} of {items.length}
          </CustomText>
          <View style={styles.railPaginationActions}>
            <TVTouchable
              onPress={() => movePage(-1)}
              disabled={firstVisibleIndex <= 0}
              showFocusBorder={false}
              style={[styles.railPaginationButton, firstVisibleIndex <= 0 ? styles.railPaginationButtonDisabled : null]}
              accessibilityRole="button"
              accessibilityLabel={`Previous ${title || 'content'} items`}
            >
              <MaterialIcons name="chevron-left" size={20} color={theme.colors.text} />
            </TVTouchable>
            <TVTouchable
              onPress={() => movePage(1)}
              disabled={firstVisibleIndex >= lastPageStart}
              showFocusBorder={false}
              style={[styles.railPaginationButton, firstVisibleIndex >= lastPageStart ? styles.railPaginationButtonDisabled : null]}
              accessibilityRole="button"
              accessibilityLabel={`Next ${title || 'content'} items`}
            >
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.text} />
            </TVTouchable>
          </View>
        </View>
      ) : null}
    </View>
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
  cardVariant?: CardVariant;
};

export function ContentRail({
  title, subtitle, items, onPressItem,
  actionLabel, onAction, onActionPress,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Try another section or search for something.',
  loading = false, compact, hideWhenEmpty = false, cardVariant = 'portrait',
}: ContentRailProps) {
  const styles = useFeedStyles();
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

      {loading ? <RailSkeleton cardVariant={cardVariant} />
        : items.length > 0 ? <ContentRailInner items={items} title={title} onPressItem={onPressItem} isCompact={isCompact} cardVariant={cardVariant} />
        : hideWhenEmpty ? null : <InlineEmpty title={emptyTitle} message={emptyMessage} />}
    </View>
  );
}
