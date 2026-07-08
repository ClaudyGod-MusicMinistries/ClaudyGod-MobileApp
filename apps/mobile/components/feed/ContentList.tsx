import React from 'react';
import { Image, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { cleanFeedText, isValidDuration } from './utils';

export function ContentList({ title, items, onPressItem, onMorePress }: {
  title: string;
  items: FeedCardItem[];
  onPressItem: (_item: FeedCardItem) => void;
  onMorePress?: (_item: FeedCardItem) => void;
}) {
  const styles = useFeedStyles();
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
