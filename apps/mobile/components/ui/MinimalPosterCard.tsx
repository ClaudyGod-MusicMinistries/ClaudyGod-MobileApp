// components/ui/MinimalPosterCard.tsx
import React from 'react';
import { View, Image, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
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
  const theme = useAppTheme();
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
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.48, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {(badge || isLive) && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: isLive ? 'rgba(239,68,68,0.95)' : 'rgba(12,8,18,0.70)',
              borderWidth: 1,
              borderColor: isLive ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.18)',
            }}
          >
            <CustomText variant="caption" style={{ color: '#FFFFFF', fontSize: 9.5, letterSpacing: 0.4 }}>
              {isLive ? 'LIVE' : badge}
            </CustomText>
          </View>
        )}

        {showMore && onMorePress ? (
          <Pressable
            onPress={onMorePress}
            hitSlop={8}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'rgba(10,7,17,0.70)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
            }}
          >
            <MaterialIcons name="more-horiz" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 12,
            paddingBottom: 12,
            paddingTop: 28,
          }}
        >
          <CustomText
            variant="label"
            style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 16, letterSpacing: -0.08 }}
            numberOfLines={2}
          >
            {title}
          </CustomText>
          {meta || subtitle ? (
            <CustomText
              variant="caption"
              style={{ color: 'rgba(255,255,255,0.70)', marginTop: 3, fontSize: 10.5, lineHeight: 14 }}
              numberOfLines={1}
            >
              {meta ?? subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
}
