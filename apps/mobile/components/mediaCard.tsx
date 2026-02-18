// components/cards/MediaCard.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { CustomText } from './CustomText';
import { radius } from '../styles/designTokens';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';
import { TVTouchable } from './ui/TVTouchable';

interface MediaCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const MediaCard: React.FC<MediaCardProps> = ({
  imageUrl,
  title,
  subtitle,
  onPress,
  size = 'md'
}) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme];

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  return (
    <TVTouchable
      onPress={onPress}
      className="mb-4"
      showFocusBorder={false}
    >
      <View
        className={`${sizeClasses[size]} overflow-hidden mb-2`}
        style={{
          borderRadius: radius.md,
          backgroundColor: palette.surface,
        }}
      >
        <Image 
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="px-1">
        <CustomText
          variant="body"
          style={{ color: palette.text.primary, fontWeight: '600' }}
          numberOfLines={1}
        >
          {title}
        </CustomText>
        {subtitle && (
          <CustomText
            variant="caption"
            style={{ color: palette.text.secondary }}
            numberOfLines={1}
          >
            {subtitle}
          </CustomText>
        )}
      </View>
    </TVTouchable>
  );
};
