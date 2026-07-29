import React from 'react';
import { Image, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { cleanFeedText, isValidDuration } from './utils';

type TrendingListProps = {
  title: string;
  items: FeedCardItem[];
  onPressItem: (_item: FeedCardItem) => void;
  actionLabel?: string;
  onAction?: () => void;
};

export function TrendingList({ title, items, onPressItem, actionLabel, onAction }: TrendingListProps) {
  const styles = useFeedStyles();
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
