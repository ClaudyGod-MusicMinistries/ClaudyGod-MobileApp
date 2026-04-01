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
  meta?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showPlay?: boolean;
  showMore?: boolean;
  onMorePress?: () => void;
  badge?: string;
  isLive?: boolean;
}

export function PosterCard({
  imageUrl,
  title,
  subtitle,
  meta,
  onPress,
  size = 'md',
  showPlay = true,
  showMore = false,
  onMorePress,
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
          backgroundColor: 'transparent',
          borderWidth: 0,
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
          colors={['rgba(7,9,12,0)', 'rgba(7,9,12,0.1)', 'rgba(7,9,12,0.86)']}
          locations={[0, 0.55, 1]}
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
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(9,12,16,0.75)',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="play-arrow" size={24} color="#F7F3EA" />
            </View>
          </View>
        )}

        {/* More Actions */}
        {showMore && onMorePress ? (
          <Pressable
            onPress={onMorePress}
            style={{
              position: 'absolute',
              right: theme.spacing.sm,
              top: theme.spacing.sm,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(9,12,16,0.72)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
            }}
          >
            <MaterialIcons name="more-vert" size={18} color="#F7F3EA" />
          </Pressable>
        ) : null}

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
              fontSize: 12,
              lineHeight: 16,
              fontWeight: '600',
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
                marginTop: 3,
                fontSize: 10.5,
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
