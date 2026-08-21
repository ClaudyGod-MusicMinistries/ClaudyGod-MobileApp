import React, { useCallback } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { getSidebarWidth } from '../../util/sidebarConfig';
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
  const sidebarWidth = getSidebarWidth(device.width);
  const mobileCardWidth = getContentCardWidth(device, isCompact);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedCardItem>) => (
      <ContentCard item={item} compact={isCompact} fixedWidth={mobileCardWidth} variant={cardVariant} onPress={() => onPressItem(item)} />
    ),
    [isCompact, mobileCardWidth, cardVariant, onPressItem],
  );

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
    <View style={{ marginHorizontal: -device.contentGutter, height: railCardHeight(mobileCardWidth, cardVariant) }}>
      <FlashList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        contentContainerStyle={{ paddingLeft: device.contentGutter, paddingRight: device.contentGutter + 8 }}
      />
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
