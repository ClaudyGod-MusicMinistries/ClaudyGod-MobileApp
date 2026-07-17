import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { ActionSheet } from '../ui/ActionSheet';
import type { ActionSheetAction } from '../ui/ActionSheet';
import { AppImage } from '../ui/AppImage';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import type { FeedCardItem } from '../../services/contentService';
import { useDownloads } from '../../context/DownloadsContext';
import { useFeedStyles } from './styles';
import { cleanFeedText, isRedundantSubtitle, isValidDuration } from './utils';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export type CardVariant = 'portrait' | 'landscape' | 'square';

type ContentCardProps = {
  item: FeedCardItem;
  onPress: () => void;
  compact?: boolean;
  variant?: CardVariant;
  fixedWidth?: number;
};

export const ContentCard = React.memo(function ContentCard({ item, onPress, compact = false, variant = 'portrait', fixedWidth }: ContentCardProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const pressScale = useRef(new Animated.Value(1)).current;
  const [menuOpen, setMenuOpen] = useState(false);
  const { downloadContent, deleteDownload, getDownloadStatus } = useDownloads();
  const downloadStatus = getDownloadStatus(item.id);

  const menuActions: ActionSheetAction[] = [
    { key: 'play', label: item.type === 'video' ? 'Watch now' : 'Play now', icon: item.type === 'video' ? 'play-circle-filled' : 'play-arrow', tone: 'accent', onPress: () => { setMenuOpen(false); onPress(); } },
    { key: 'share', label: 'Share', icon: 'share', onPress: () => { setMenuOpen(false); void Share.share({ title: item.title, message: item.subtitle ? `${item.title} — ${item.subtitle}` : item.title }); } },
    ...(item.mediaUrl ? [
      downloadStatus === 'done'
        ? { key: 'download', label: 'Remove download', icon: 'delete-outline' as const, tone: 'destructive' as const, onPress: () => { setMenuOpen(false); void deleteDownload(item.id); } }
        : { key: 'download', label: downloadStatus === 'downloading' ? 'Downloading…' : 'Download', icon: 'file-download' as const, onPress: () => { setMenuOpen(false); void downloadContent(item); } },
    ] : []),
  ];

  const cardWidth = fixedWidth ?? (compact ? 208 : device.isTV ? 300 : device.isDesktop ? 240 : 236);
  const cardHeight = variant === 'portrait' ? Math.round(cardWidth * 1.45) : variant === 'landscape' ? Math.round(cardWidth * 0.62) : cardWidth;
  const scrimHeight = variant === 'portrait' ? Math.round(cardHeight * 0.55) : variant === 'landscape' ? Math.round(cardHeight * 0.60) : Math.round(cardHeight * 0.50);
  const title = cleanFeedText(item.title);

  const handlePressIn  = () => Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: USE_NATIVE_DRIVER, friction: 10, tension: 120 }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, friction: 7, tension: 70 }).start();

  return (
    <TVTouchable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} showFocusBorder={false} style={{ width: cardWidth }}>
      <Animated.View style={{ gap: 7, transform: [{ scale: pressScale }] }}>
        <View style={[styles.artworkShadowWrap, { width: cardWidth, height: cardHeight }]}>
          <View style={[styles.artworkContainer, StyleSheet.absoluteFillObject]}>
            <AppImage uri={item.imageUrl} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.68)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: scrimHeight }} />
            <View style={styles.cardPlayBadge}>
              <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
            </View>
            {item.isLive ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveBadgeDot} />
                <CustomText style={styles.liveBadgeText}>LIVE</CustomText>
              </View>
            ) : null}
            {isValidDuration(item.duration) && !item.isLive ? (
              <View style={styles.durationPill}>
                <CustomText style={styles.durationText}>{item.duration}</CustomText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardTextArea}>
          <View style={styles.cardTitleRow}>
            <CustomText variant="label" style={styles.cardTitle} numberOfLines={2}>{title}</CustomText>
            <Pressable onPress={(e) => { e.stopPropagation?.(); setMenuOpen(true); }} hitSlop={{ top: 8, right: 8, bottom: 8, left: 4 }} style={styles.cardMoreBtn}>
              <MaterialIcons name="more-vert" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          {item.subtitle && !isRedundantSubtitle(item.title, item.subtitle) ? (
            <CustomText variant="caption" style={styles.cardSubtitle} numberOfLines={1}>{cleanFeedText(item.subtitle)}</CustomText>
          ) : null}
        </View>
      </Animated.View>

      <ActionSheet visible={menuOpen} title={title} description={item.subtitle ? cleanFeedText(item.subtitle) : undefined} actions={menuActions} onClose={() => setMenuOpen(false)} />
    </TVTouchable>
  );
});
