// components/ui/PosterCard.tsx
import React from 'react';
import { View, Image, Pressable } from 'react-native';
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
  badge?: string;
  isLive?: boolean;
}

export function PosterCard({
  imageUrl,
  title,
  subtitle,
  onPress,
  size = 'md',
  showPlay = true,
  badge,
  isLive = false,
}: PosterCardProps) {
  const theme = useAppTheme();
  const sizes = {
    sm: { w: 120, h: 172 },
    md: { w: 140, h: 196 },
    lg: { w: 168, h: 236 },
  }[size];

  return (
    <TVTouchable
      onPress={onPress}
      style={{ 
        width: sizes.w, 
        marginRight: theme.spacing.md,
        borderRadius: theme.radius.lg,
        overflow: 'hidden'
      }}
      activeOpacity={0.85}
    >
      <View
        style={{
          width: sizes.w,
          height: sizes.h,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          ...theme.shadows.card,
        }}
      >
        {/* Image Container with proper fit */}
        <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <Image 
            source={{ uri: imageUrl }} 
            style={{ width: '100%', height: '100%' }} 
            resizeMode="cover"
          />
        </View>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(7,9,12,0)', 'rgba(7,9,12,0.15)', 'rgba(7,9,12,0.92)']}
          locations={[0, 0.5, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' }}
        />

        {/* Badge */}
        {(badge || isLive) && (
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.md,
              left: theme.spacing.md,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: theme.radius.sm,
              backgroundColor: isLive ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.9)',
              borderWidth: 1,
              borderColor: isLive ? 'rgba(255,100,100,0.4)' : 'rgba(100,150,255,0.4)',
            }}
          >
            <CustomText 
              variant="caption" 
              style={{ 
                color: '#FFFFFF', 
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              {isLive ? 'LIVE' : badge}
            </CustomText>
          </View>
        )}

        {/* Play Button */}
        {showPlay && !isLive && (
          <Pressable
            style={{
              position: 'absolute',
              right: theme.spacing.md,
              top: theme.spacing.md,
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              backgroundColor: 'rgba(9,12,16,0.75)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="play-arrow" size={22} color="#F7F3EA" />
          </Pressable>
        )}

        {/* Live Indicator Pulsing Dot */}
        {isLive && (
          <View
            style={{
              position: 'absolute',
              right: theme.spacing.md,
              top: theme.spacing.md,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(239,68,68,0.2)',
              borderWidth: 2,
              borderColor: 'rgba(239,68,68,0.8)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#EF4444',
              }}
            />
          </View>
        )}

        {/* Text Content */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 12,
            paddingBottom: 12,
            paddingTop: 40,
          }}
        >
          <CustomText
            variant="subtitle"
            style={{ 
              color: '#F7F3EA', 
              fontSize: 11.5, 
              lineHeight: 16,
              fontWeight: '500',
            }}
            numberOfLines={1}
          >
            {title}
          </CustomText>
          {subtitle ? (
            <CustomText
              variant="caption"
              style={{ 
                color: 'rgba(232,226,216,0.72)', 
                marginTop: 4,
                fontSize: 10,
              }}
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
