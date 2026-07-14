import React from 'react';
import { Image, View, useWindowDimensions } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { BRAND_MUSIC_ASSET } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { cleanFeedText } from './utils';

type StreamingBannerProps = {
  item?: FeedCardItem | null;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
};

export function StreamingBanner({ item, badge = 'Featured', title, subtitle, ctaLabel = 'Play now', onPress }: StreamingBannerProps) {
  const styles = useFeedStyles();
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
            <View style={{ width: artSize, height: artSize, alignSelf: 'center', position: 'relative', flexShrink: 0 }}>
              <Image source={item?.imageUrl ? { uri: item.imageUrl } : BRAND_MUSIC_ASSET} resizeMode="cover" style={{ width: artSize, height: artSize }} />
            </View>
          </View>
        </View>
      </TVTouchable>
    </FadeIn>
  );
}
