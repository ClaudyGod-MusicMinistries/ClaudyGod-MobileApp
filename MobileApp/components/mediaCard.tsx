// components/cards/MediaCard.tsx
import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { CustomText } from './CustomText';

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
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40',
    lg: 'w-48 h-48'
  };

  return (
    <TouchableOpacity onPress={onPress} className="mb-4">
      <View className={`${sizeClasses[size]} rounded-xl bg-gray-800 overflow-hidden mb-2`}>
        <Image 
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="px-1">
        <CustomText variant="body" className="text-white font-semibold" numberOfLines={1}>
          {title}
        </CustomText>
        {subtitle && (
          <CustomText variant="caption" className="text-gray-400" numberOfLines={1}>
            {subtitle}
          </CustomText>
        )}
      </View>
    </TouchableOpacity>
  );
};
