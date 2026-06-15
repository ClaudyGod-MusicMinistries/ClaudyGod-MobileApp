// components/ui/PosterCard.tsx
import React from 'react';
import { View, Image, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface PosterCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showPlay?: boolean;
  showMore?: boolean;
  onMorePress?: () => void;
  badge?: string;
  isLive?: boolean;
}

export function PosterCard({
  imageUrl,
  title,
  subtitle,
  meta,
  onPress,
  size = 'md',
  showPlay = true,
  showMore = false,
  onMorePress,
  badge,
  isLive = false,
}: PosterCardProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const scale = width >= 1024 ? 1.08 : width >= 768 ? 1.04 : width < 360 ? 0.92 : 1;
  const sizes = {
    sm: { w: 170, h: 236 },
    md: { w: 204, h: 280 },
    lg: { w: 236, h: 318 },
  }[size];
  const cardWidth = Math.round(sizes.w * scale);
  const cardHeight = Math.round(sizes.h * scale);

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: cardWidth,
        marginRight: theme.spacing.md,
        borderRadius: theme.radius.xl,
      }}
      activeOpacity={0.82}
      showFocusBorder={false}
    >
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: theme.radius.xl,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          ...theme.shadows.soft,
        }}
      >
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />

        <LinearGradient
          colors={['rgba(7,4,13,0)', 'rgba(7,4,13,0.12)', 'rgba(7,4,13,0.88)']}
          locations={[0, 0.48, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {(badge || isLive) && (
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.sm,
              left: theme.spacing.sm,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: theme.radius.pill,
              backgroundColor: isLive ? 'rgba(239,68,68,0.96)' : 'rgba(10,7,17,0.70)',
              borderWidth: 1,
              borderColor: isLive ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)',
            }}
          >
            <CustomText variant="caption" style={{ color: '#FFFFFF', fontSize: 10, letterSpacing: 0.5 }}>
              {isLive ? 'LIVE' : badge}
            </CustomText>
          </View>
        )}

        {showPlay && !isLive ? (
          <View
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              bottom: 76,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.sm,
            }}
          >
            <MaterialIcons name="play-arrow" size={26} color={theme.colors.textInverse} />
          </View>
        ) : null}

        {showMore && onMorePress ? (
          <Pressable
            onPress={onMorePress}
            hitSlop={8}
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              top: theme.spacing.sm,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: 'rgba(10,7,17,0.70)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
            }}
          >
            <MaterialIcons name="more-horiz" size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {isLive ? (
          <View
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              top: theme.spacing.sm,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(239,68,68,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.75)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
          </View>
        ) : null}

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 14,
            paddingBottom: 14,
            paddingTop: 46,
          }}
        >
          <CustomText
            variant="title"
            style={{ color: '#FFFFFF', fontSize: 13.2, lineHeight: 18, letterSpacing: 0 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </CustomText>
          {meta || subtitle ? (
            <CustomText
              variant="caption"
              style={{ color: 'rgba(255,255,255,0.72)', marginTop: 4, fontSize: 11, lineHeight: 15 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {meta ?? subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
}
