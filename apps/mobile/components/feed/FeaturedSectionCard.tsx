import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { FadeIn } from '../ui/FadeIn';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { cleanFeedText, isValidDuration } from './utils';

type FeaturedSectionCardProps = {
  sectionTitle: string;
  item: FeedCardItem | null;
  onPress: () => void;
  onSeeAll: () => void;
  loading?: boolean;
  actionLabel?: string;
};

export function FeaturedSectionCard({ sectionTitle, item, onPress, onSeeAll, loading = false, actionLabel = 'See all' }: FeaturedSectionCardProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const { width } = useWindowDimensions();
  const compact    = width < 430;
  const cardHeight = device.isTV ? 340 : device.isLargeDesktop ? 300 : device.isDesktop ? 260 : compact ? 210 : 230;

  if (loading) {
    return (
      <View style={{ gap: 14 }}>
        <View style={styles.featuredHeader}>
          <SkeletonLoader width={140} height={22} borderRadius={8} />
          <SkeletonLoader width={56} height={16} borderRadius={8} />
        </View>
        <SkeletonLoader width="100%" height={cardHeight} borderRadius={16} />
      </View>
    );
  }

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isLive  = item.isLive;
  const playLabel = isLive ? 'Watch live' : isVideo ? 'Watch' : 'Play';
  const playIcon: React.ComponentProps<typeof MaterialIcons>['name'] = isLive ? 'live-tv' : 'play-arrow';

  return (
    <FadeIn>
      <View style={{ gap: 14 }}>
        <View style={styles.featuredHeader}>
          <CustomText style={{ color: theme.colors.text, fontSize: compact ? 18 : 20, fontWeight: '800', letterSpacing: -0.5 }} numberOfLines={1}>
            {sectionTitle}
          </CustomText>
          <TVTouchable onPress={onSeeAll} showFocusBorder={false} style={styles.featuredActionBtn}>
            <CustomText style={styles.featuredActionText}>{actionLabel}</CustomText>
            <MaterialIcons name="chevron-right" size={15} color={theme.colors.primary} />
          </TVTouchable>
        </View>

        <TVTouchable onPress={onPress} showFocusBorder={false}>
          <View style={[styles.featuredCardShell, { height: cardHeight }]}>
            <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(cardHeight * 0.6) }} />

            {isLive ? (
              <View style={[styles.featuredLiveBadge, { backgroundColor: theme.colors.danger }]}>
                <View style={styles.featuredLiveDot} />
                <CustomText style={styles.featuredLiveText}>LIVE</CustomText>
              </View>
            ) : null}

            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: compact ? 14 : 18, gap: 8 }}>
              <CustomText style={{ color: '#FFFFFF', fontSize: compact ? 15 : 17, fontWeight: '700', letterSpacing: -0.3, lineHeight: compact ? 21 : 24 }} numberOfLines={2}>
                {cleanFeedText(item.title)}
              </CustomText>
              <View style={styles.featuredPlayRow}>
                <View style={[styles.featuredPlayBtn, { backgroundColor: isLive ? theme.colors.danger : theme.colors.primary }]}>
                  <MaterialIcons name={playIcon} size={15} color="#fff" />
                  <CustomText style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{playLabel}</CustomText>
                </View>
                {isValidDuration(item.duration) && !isLive ? <CustomText style={styles.featuredSubText}>{item.duration}</CustomText> : null}
                {item.subtitle ? <CustomText style={[styles.featuredSubText, { flex: 1 }]} numberOfLines={1}>{cleanFeedText(item.subtitle)}</CustomText> : null}
              </View>
            </View>
          </View>
        </TVTouchable>
      </View>
    </FadeIn>
  );
}
