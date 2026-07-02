import React, { useState, useRef } from 'react';
import { View, Image, Platform, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface ModernContentCardProps {
  id: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  author?: string;
  plays?: number;
  likes?: number;
  duration?: string;
  isPlaying?: boolean;
  onPress: () => void;
  onPlayPress?: () => void;
  badge?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getCardDimensions = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':  return { imageHeight: 96,  imageWidth: 96,  fontSize: 10, gap: 4 };
    case 'lg':  return { imageHeight: 160, imageWidth: 160, fontSize: 12, gap: 6 };
    default:    return { imageHeight: 124, imageWidth: 124, fontSize: 11, gap: 5 };
  }
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  animOuter:    { borderRadius: theme.radius.md },
  cardShell:    { borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.elevated },
  imageFill:    { flex: 1, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  gradientFill: { position: 'absolute', width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: theme.spacing.xs, right: theme.spacing.xs, zIndex: 10,
    backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.xs, paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  badgeText:    { color: '#FFFFFF', fontWeight: '600' },
  playBtn: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    top: '50%', left: '50%',
    width: theme.spacing.xxl, height: theme.spacing.xxl, borderRadius: theme.spacing.xxl / 2,
    backgroundColor: theme.colors.primary,
    marginTop: -(theme.spacing.xxl / 2), marginLeft: -(theme.spacing.xxl / 2),
  },
  titleText: {
    color: theme.colors.text, fontWeight: '600', marginBottom: theme.spacing.xs,
  },
  subtitleText: { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
  authorText:   { color: theme.colors.textSecondary, fontSize: 9, marginBottom: 6 },
  statsRow:     { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  statsItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsText:    { color: theme.colors.textSecondary, fontSize: 10 },
  durationText: { color: theme.colors.textSecondary, fontSize: 10 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function ModernContentCard({
  id: _id,
  imageUrl,
  title,
  subtitle,
  author,
  plays,
  likes,
  duration,
  isPlaying = false,
  onPress,
  onPlayPress,
  badge,
  size = 'md',
}: ModernContentCardProps) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.timing(scaleAnim, { toValue: theme.interaction.pressScale, duration: theme.timing.fast, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.timing(scaleAnim, { toValue: 1, duration: theme.timing.moderate, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  void pressed;

  const dims = getCardDimensions(size);

  return (
    <Animated.View style={[styles.animOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.cardShell}>
        <View style={{ position: 'relative', width: dims.imageWidth, height: dims.imageHeight }}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={styles.imageFill}>
              <MaterialIcons name="music-note" size={dims.fontSize * 1.5} color={theme.colors.accent} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientFill}
          />

          {badge ? (
            <View style={styles.badge}>
              <CustomText variant="caption" style={styles.badgeText}>{badge}</CustomText>
            </View>
          ) : null}

          {onPlayPress ? (
            <Pressable onPress={onPlayPress} style={styles.playBtn}>
              <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={dims.fontSize} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <View style={{ padding: size === 'sm' ? theme.spacing.xs : theme.spacing.sm }}>
          <CustomText
            numberOfLines={2}
            style={[styles.titleText, { fontSize: dims.fontSize }]}
          >
            {title}
          </CustomText>

          {subtitle ? (
            <CustomText
              numberOfLines={1}
              style={[styles.subtitleText, { fontSize: dims.fontSize * 0.85 }]}
            >
              {subtitle}
            </CustomText>
          ) : null}

          {author ? (
            <CustomText numberOfLines={1} style={styles.authorText}>{author}</CustomText>
          ) : null}

          {(plays !== undefined || likes !== undefined || duration) ? (
            <View style={styles.statsRow}>
              {plays !== undefined ? (
                <View style={styles.statsItem}>
                  <MaterialIcons name="play-circle-outline" size={12} color={theme.colors.textSecondary} />
                  <CustomText style={styles.statsText}>
                    {plays > 1000 ? (plays / 1000).toFixed(1) + 'K' : plays}
                  </CustomText>
                </View>
              ) : null}
              {likes !== undefined ? (
                <View style={styles.statsItem}>
                  <MaterialIcons name="favorite-border" size={12} color={theme.colors.textSecondary} />
                  <CustomText style={styles.statsText}>
                    {likes > 1000 ? (likes / 1000).toFixed(1) + 'K' : likes}
                  </CustomText>
                </View>
              ) : null}
              {duration ? (
                <CustomText style={styles.durationText}>{duration}</CustomText>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
