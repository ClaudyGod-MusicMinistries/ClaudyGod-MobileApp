// components/ui/PosterCard.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface PosterCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showPlay?: boolean;
}

export function PosterCard({
  imageUrl,
  title,
  subtitle,
  onPress,
  size = 'md',
  showPlay = true,
}: PosterCardProps) {
  const theme = useAppTheme();
  const sizes = {
    sm: { w: 108, h: 140 },
    md: { w: 128, h: 168 },
    lg: { w: 156, h: 200 },
  }[size];

  return (
    <TVTouchable
      onPress={onPress}
      style={{ width: sizes.w, marginRight: theme.spacing.md }}
      activeOpacity={0.9}
    >
      <View
        style={{
          width: sizes.w,
          height: sizes.h,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.soft,
        }}
      >
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(7,9,12,0)', 'rgba(7,9,12,0.2)', 'rgba(7,9,12,0.88)']}
          locations={[0, 0.45, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.min(110, sizes.h * 0.56) }}
        />
          {showPlay ? (
            <View
              style={{
                position: 'absolute',
                right: theme.spacing.sm,
                top: theme.spacing.sm,
                width: 26,
                height: 26,
                borderRadius: 8,
                backgroundColor: 'rgba(9,12,16,0.72)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="play-arrow" size={14} color="#F7F3EA" />
            </View>
          ) : null}

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 12,
            paddingBottom: 12,
            paddingTop: 30,
          }}
        >
          <CustomText
            variant="subtitle"
            style={{ color: '#F7F3EA', fontSize: 10, lineHeight: 13 }}
            numberOfLines={2}
          >
            {title}
          </CustomText>
          {subtitle ? (
            <CustomText
              variant="caption"
              style={{ color: 'rgba(232,226,216,0.74)', marginTop: 4 }}
              numberOfLines={1}
            >
              {subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
}
