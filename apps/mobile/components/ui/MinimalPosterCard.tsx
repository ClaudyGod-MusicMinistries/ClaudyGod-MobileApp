// components/ui/MinimalPosterCard.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface MinimalPosterCardProps {
  imageUrl: string;
  title: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
  isLive?: boolean;
}

/**
 * Minimal Poster Card - Clean, professional design with minimal text
 * Perfect for content discovery in feed/rails
 */
export function MinimalPosterCard({
  imageUrl,
  title,
  onPress,
  size = 'md',
  badge,
  isLive = false,
}: MinimalPosterCardProps) {
  const theme = useAppTheme();

  const sizes = {
    sm: { w: 96, h: 140 },
    md: { w: 112, h: 160 },
    lg: { w: 124, h: 176 },
  }[size];

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width: sizes.w,
        height: sizes.h,
        marginRight: theme.spacing.md,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
      }}
      activeOpacity={0.85}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
        }}
      >
        {/* Image */}
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        {/* Dark Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
          locations={[0, 0.5, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Badge */}
        {(badge || isLive) && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: theme.radius.sm,
              backgroundColor: isLive ? 'rgba(239,68,68,0.95)' : 'rgba(59,130,246,0.9)',
              borderWidth: 1,
              borderColor: isLive ? 'rgba(255,100,100,0.5)' : 'rgba(100,150,255,0.5)',
            }}
          >
            <CustomText
              variant="caption"
              style={{
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: '700',
              }}
            >
              {isLive ? '●' : badge}
            </CustomText>
          </View>
        )}

        {/* Minimal corner marker */}
        {!isLive ? (
          <View
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 22,
              height: 22,
              borderRadius: theme.radius.sm,
              backgroundColor: 'rgba(10,10,15,0.6)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          />
        ) : null}

        {/* Title - Minimal */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 10,
            paddingBottom: 10,
            paddingTop: 20,
          }}
        >
          <CustomText
            variant="body"
            style={{
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: '500',
              lineHeight: 14,
            }}
            numberOfLines={1}
          >
            {title}
          </CustomText>
        </View>
      </View>
    </TVTouchable>
  );
}
