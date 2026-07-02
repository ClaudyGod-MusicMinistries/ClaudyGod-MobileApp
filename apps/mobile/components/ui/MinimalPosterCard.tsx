// components/ui/MinimalPosterCard.tsx
import React from 'react';
import { View, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';

interface MinimalPosterCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
  isLive?: boolean;
  showMore?: boolean;
  onMorePress?: () => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  touchable:    { marginRight: theme.spacing.md, borderRadius: theme.radius.xl },
  cardView: {
    borderRadius: theme.radius.xl, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  badgeBase: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: theme.radius.pill, borderWidth: 1,
  },
  badgeLive:    { backgroundColor: 'rgba(239,68,68,0.95)', borderColor: 'rgba(255,255,255,0.30)' },
  badgeNormal:  { backgroundColor: 'rgba(12,8,18,0.70)', borderColor: 'rgba(255,255,255,0.18)' },
  badgeText:    { color: '#FFFFFF', fontSize: 9.5, letterSpacing: 0.4 },
  moreBtn: {
    position: 'absolute', right: 8, top: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(10,7,17,0.70)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', zIndex: 4,
  },
  titleBlock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 28,
  },
  titleText: { color: '#FFFFFF', fontSize: 11.4, lineHeight: 15.5, letterSpacing: 0 },
  metaText:  { color: 'rgba(255,255,255,0.70)', marginTop: 3, fontSize: 10.5, lineHeight: 14 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function MinimalPosterCard({
  imageUrl,
  title,
  subtitle,
  meta,
  onPress,
  size = 'md',
  badge,
  isLive = false,
  showMore = false,
  onMorePress,
}: MinimalPosterCardProps) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const scale = width >= 768 ? 1.06 : width < 360 ? 0.92 : 1;

  const sizes = {
    sm: { w: 132, h: 160 },
    md: { w: 148, h: 178 },
    lg: { w: 166, h: 200 },
  }[size];

  const cardWidth = Math.round(sizes.w * scale);
  const cardHeight = Math.round(sizes.h * scale);

  return (
    <TVTouchable
      onPress={onPress}
      style={[styles.touchable, { width: cardWidth }]}
      activeOpacity={0.82}
      showFocusBorder={false}
    >
      <View style={[styles.cardView, { width: cardWidth, height: cardHeight }]}>
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {(badge || isLive) ? (
          <View style={[styles.badgeBase, isLive ? styles.badgeLive : styles.badgeNormal]}>
            <CustomText variant="caption" style={styles.badgeText}>
              {isLive ? 'LIVE' : badge}
            </CustomText>
          </View>
        ) : null}

        {showMore && onMorePress ? (
          <Pressable onPress={onMorePress} hitSlop={8} style={styles.moreBtn}>
            <MaterialIcons name="more-horiz" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}

        <View style={styles.titleBlock}>
          <CustomText variant="label" style={styles.titleText} numberOfLines={2}>
            {title}
          </CustomText>
          {meta || subtitle ? (
            <CustomText variant="caption" style={styles.metaText} numberOfLines={1}>
              {meta ?? subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
}
