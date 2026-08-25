import React from 'react';
import { View, Image, Pressable, StyleSheet, ImageStyle } from 'react-native';
import { CustomText } from './CustomText';
import { TVTouchable } from './ui/TVTouchable';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles } from '../styles/makeStyles';
import { mediaTokens } from '../constants/color';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  cardWrap: {
    borderRadius: theme.radius.lg, overflow: 'hidden', marginRight: 12,
  },
  cardImg: {
    overflow: 'hidden', borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceAlt,
  },
  fillWrap:      { width: '100%', height: '100%', overflow: 'hidden' },
  fill:          { width: '100%', height: '100%' },
  overlayCenter: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: mediaTokens.overlay, borderWidth: 1,
    borderColor: mediaTokens.border, alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    position: 'absolute', right: 8, top: 8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: mediaTokens.overlay, borderWidth: 1,
    borderColor: mediaTokens.border, alignItems: 'center', justifyContent: 'center', zIndex: 4,
  },
  viewCount: {
    position: 'absolute', right: 8, bottom: 56,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.sm,
    backgroundColor: mediaTokens.overlay, borderWidth: 1,
    borderColor: mediaTokens.border,
  },
  viewCountText: { color: mediaTokens.textMuted, fontSize: 10 },
  titleWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 24,
  },
  titleText:     { color: mediaTokens.text, fontSize: 12.5, fontWeight: '600', lineHeight: 16 },
  metaText:      { color: mediaTokens.textSubtle, marginTop: 3, fontSize: 10.5, lineHeight: 14 },
  badgeBase: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: theme.radius.sm, borderWidth: 1,
  },
  badgeLive:    { backgroundColor: theme.colors.liveSurface, borderColor: theme.colors.dangerBorder },
  badgeDefault: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryBorder },
  badgeText:    { color: mediaTokens.text, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface MediaCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
  isLive?: boolean;
  viewCount?: number;
  showMore?: boolean;
  onMorePress?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  imageUrl,
  title,
  subtitle,
  meta,
  onPress,
  size = 'md',
  badge,
  isLive = false,
  viewCount,
  showMore = false,
  onMorePress,
}) => {
  const styles = useStyles();

  const sizeConfig = size === 'sm' ? { w: 140, h: 200 }
    : size === 'lg' ? { w: 200, h: 280 }
    : { w: 160, h: 220 };

  return (
    <TVTouchable
      onPress={onPress}
      style={[styles.cardWrap, { width: sizeConfig.w }]}
      activeOpacity={0.8}
    >
      <View style={[styles.cardImg, { width: sizeConfig.w, height: sizeConfig.h }]}>
        <View style={styles.fillWrap}>
          <Image source={{ uri: imageUrl }} style={styles.fill as ImageStyle} resizeMode="cover" />
        </View>

        <LinearGradient
          colors={['transparent', mediaTokens.overlayFaint, mediaTokens.overlayStrong]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {(badge || isLive) ? (
          <View style={[styles.badgeBase, isLive ? styles.badgeLive : styles.badgeDefault]}>
            <CustomText variant="caption" style={styles.badgeText}>
              {isLive ? '● LIVE' : badge}
            </CustomText>
          </View>
        ) : null}

        {!isLive ? (
          <View style={styles.overlayCenter}>
            <View style={styles.playCircle}>
              <MaterialIcons name="play-arrow" size={24} color={mediaTokens.text} />
            </View>
          </View>
        ) : null}

        {showMore && onMorePress ? (
          <Pressable onPress={onMorePress} style={styles.moreBtn}>
            <MaterialIcons name="more-vert" size={18} color={mediaTokens.text} />
          </Pressable>
        ) : null}

        {viewCount !== undefined ? (
          <View style={styles.viewCount}>
            <CustomText variant="caption" style={styles.viewCountText}>
              {viewCount > 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount} watching
            </CustomText>
          </View>
        ) : null}

        <View style={styles.titleWrap}>
          <CustomText variant="body" style={styles.titleText} numberOfLines={2}>{title}</CustomText>
          {(meta ?? subtitle) ? (
            <CustomText variant="caption" style={styles.metaText} numberOfLines={1}>
              {meta ?? subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
};
