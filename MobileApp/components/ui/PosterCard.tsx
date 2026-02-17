// components/ui/PosterCard.tsx
import React from 'react';
import { Platform, View, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { tv as tvTokens } from '../../styles/designTokens';

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
  const isTV = Platform.isTV;
  const sizes = {
    sm: { w: 124, h: 150 },
    md: { w: 164, h: 204 },
    lg: { w: 204, h: 248 },
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      focusable
      hitSlop={isTV ? tvTokens.hitSlop : undefined}
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
        style={{ color: theme.colors.text.primary, marginTop: 8 }}
        numberOfLines={1}
      >
        {title}
      </CustomText>
      {subtitle ? (
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }} numberOfLines={1}>
          {subtitle}
        </CustomText>
      ) : null}
    </TouchableOpacity>
  );
}
