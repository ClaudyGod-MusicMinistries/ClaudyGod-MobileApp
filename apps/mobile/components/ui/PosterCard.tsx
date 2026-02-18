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
    sm: { w: 126, h: 156 },
    md: { w: 160, h: 200 },
    lg: { w: 202, h: 244 },
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
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.soft,
        }}
      >
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 }}
        />
        {showPlay ? (
          <View
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              top: theme.spacing.sm,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <CustomText
        variant="label"
        style={{ color: theme.colors.text.primary, marginTop: 8, fontSize: 12.5, lineHeight: 16 }}
        numberOfLines={1}
      >
        {title}
      </CustomText>
      {subtitle ? (
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 1 }} numberOfLines={1}>
          {subtitle}
        </CustomText>
      ) : null}
    </TVTouchable>
  );
}
