// components/ui/MinimalPosterCard.tsx
import React from 'react';
import { View, Image, Pressable } from 'react-native';
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

/**
 * Minimal Poster Card - Clean, professional design with minimal text
 * Perfect for content discovery in feed/rails
 */
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

  const sizes = {
    sm: { w: 120, h: 120 },
    md: { w: 136, h: 136 },
    lg: { w: 152, h: 152 },
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
          backgroundColor: 'transparent',
          borderWidth: 0,
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

        {/* More Actions */}
        {showMore && onMorePress ? (
          <Pressable
            onPress={onMorePress}
            style={{
              position: 'absolute',
              right: 6,
              top: 6,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: 'rgba(10,10,15,0.72)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
            }}
          >
            <MaterialIcons name="more-vert" size={16} color="#F7F3EA" />
          </Pressable>
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
              fontSize: 10.5,
              fontWeight: '600',
              lineHeight: 14,
            }}
            numberOfLines={2}
          >
            {title}
          </CustomText>
          {meta || subtitle ? (
            <CustomText
              variant="caption"
              style={{
                color: 'rgba(232,226,216,0.7)',
                marginTop: 2,
                fontSize: 9.5,
                lineHeight: 12,
              }}
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
