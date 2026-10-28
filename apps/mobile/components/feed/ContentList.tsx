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
  title?: string;
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

  return (
    <FadeIn delay={120}>
      <View>
        {title ? <CustomText variant="title" style={styles.listTitle}>{title}</CustomText> : null}
        <View style={useGrid ? { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } : { gap: 6 }}>
          {items.map((item, index) => {
            const isAudio = item.type === 'audio';
            const thumbW = useGrid ? (isAudio ? 56 : 96) : (isAudio ? 54 : 86);
            const thumbH = useGrid ? 56 : (isAudio ? 54 : 48);

            return (
              <TVTouchable
                key={`${title ?? 'content'}-${item.id}`}
                onPress={() => onPressItem(item)}
                showFocusBorder={false}
                style={useGrid ? { width: `${Math.floor(100 / numCols) - 1}%` } : undefined}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}>
                  <View style={[styles.listItemThumb, { width: thumbW, height: thumbH, borderRadius: 8 }]}>
                    <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={styles.listItemImg} />
                    {isValidDuration(item.duration) ? (
                      <View style={[styles.listDuration, { backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 4 }]}>
                        <CustomText style={styles.listDurationText}>{item.duration}</CustomText>
                      </View>
                    ) : null}
                  </View>
                  <View style={common.flex1}>
                    <CustomText variant="label" style={[styles.listItemTitle, { fontSize: 13, lineHeight: 18 }]} numberOfLines={2}>
                      {cleanFeedText(item.title)}
                    </CustomText>
                    <CustomText variant="caption" style={[styles.listItemSubtitle, { fontSize: 11, marginTop: 2 }]} numberOfLines={1}>
                      {cleanFeedText(item.subtitle)}
                    </CustomText>
                  </View>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.colors.primarySurface,
                    borderWidth: 1,
                    borderColor: theme.colors.primaryBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MaterialIcons name="play-arrow" size={17} color={theme.colors.primary} />
                  </View>
                  {onMorePress ? (
                    <TVTouchable onPress={() => onMorePress(item)} showFocusBorder={false} style={{ padding: 4 }}>
                      <MaterialIcons name="more-vert" size={18} color={theme.colors.textMuted} />
                    </TVTouchable>
                  ) : null}
                </View>
              </TVTouchable>
            );
          })}
        </View>
      </View>
    </FadeIn>
  );
}
