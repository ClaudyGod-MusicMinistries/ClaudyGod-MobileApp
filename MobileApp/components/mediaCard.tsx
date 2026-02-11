// components/cards/MediaCard.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Platform } from 'react-native';
import { CustomText } from './CustomText';
import { radius, tv as tvTokens } from '../styles/designTokens';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';

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
  const [focused, setFocused] = useState(false);
  const isTV = Platform.isTV;

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4"
      focusable
      hitSlop={tvTokens.hitSlop}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={focused ? { transform: [{ scale: tvTokens.focusScale }], ...tvTokens.focusShadow } : undefined}
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
    </TouchableOpacity>
  );
};
