// components/ui/PosterCard.tsx
import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

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
    sm: { w: 120, h: 140 },
    md: { w: 160, h: 200 },
    lg: { w: 200, h: 240 },
  }[size];

  return (
    <TouchableOpacity onPress={onPress} style={{ width: sizes.w, marginRight: theme.spacing.md }}>
      <View
        style={{
          width: sizes.w,
          height: sizes.h,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
      }}
    >
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {showPlay ? (
          <View
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              bottom: theme.spacing.sm,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="play-arrow" size={20} color={theme.colors.text.inverse} />
          </View>
        ) : null}
      </View>
      <CustomText
        className="font-semibold"
        style={{ color: theme.colors.text.primary, marginTop: 6 }}
        numberOfLines={1}
      >
        {title}
      </CustomText>
      {subtitle ? (
        <CustomText style={{ color: theme.colors.text.secondary }} numberOfLines={1}>
          {subtitle}
        </CustomText>
      ) : null}
    </TouchableOpacity>
  );
}
