// components/cards/MediaCard.tsx
import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { CustomText } from './CustomText';
import { TVTouchable } from './ui/TVTouchable';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../util/colorScheme';

interface MediaCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
  isLive?: boolean;
  viewCount?: number;
  showMore?: boolean;
  onMorePress?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  imageUrl,
  title,
  subtitle,
  meta,
  onPress,
  size = 'md',
  badge,
  isLive = false,
  viewCount,
  showMore = false,
  onMorePress,
}) => {
  const theme = useAppTheme();

  const sizeConfig = size === 'sm' ? { w: 140, h: 200 }
    : size === 'lg' ? { w: 200, h: 280 }
    : { w: 160, h: 220 };

  return (
    <TVTouchable
      onPress={onPress}
      style={{ width: sizeConfig.w, borderRadius: theme.radius.lg, overflow: 'hidden', marginRight: 12 }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: sizeConfig.w,
          height: sizeConfig.h,
          overflow: 'hidden',
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceAlt,
        }}
      >
        <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.86)']}
          locations={[0, 0.55, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {(badge || isLive) ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: theme.radius.sm,
              backgroundColor: isLive ? 'rgba(239,68,68,0.95)' : theme.colors.primary,
              borderWidth: 1,
              borderColor: isLive ? 'rgba(255,100,100,0.5)' : theme.colors.primaryBorder,
            }}
          >
            <CustomText variant="caption" style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
              {isLive ? '● LIVE' : badge}
            </CustomText>
          </View>
        ) : null}

        {!isLive ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(10,10,15,0.82)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
            </View>
          </View>
        ) : null}

        {showMore && onMorePress ? (
          <Pressable
            onPress={onMorePress}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(10,10,15,0.75)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
            }}
          >
            <MaterialIcons name="more-vert" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {viewCount !== undefined ? (
          <View
            style={{
              position: 'absolute',
              right: 8,
              bottom: 56,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: theme.radius.sm,
              backgroundColor: 'rgba(10,10,15,0.7)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>
              {viewCount > 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount} watching
            </CustomText>
          </View>
        ) : null}

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 24 }}>
          <CustomText
            variant="body"
            style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '600', lineHeight: 16 }}
            numberOfLines={2}
          >
            {title}
          </CustomText>
          {(meta ?? subtitle) ? (
            <CustomText
              variant="caption"
              style={{ color: 'rgba(255,255,255,0.7)', marginTop: 3, fontSize: 10.5, lineHeight: 14 }}
              numberOfLines={1}
            >
              {meta ?? subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
};
