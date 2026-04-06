// components/ui/PosterCard.tsx
import React from 'react';
import { View, Image, Pressable, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const scale =
    width >= 1024 ? 1.12 :
    width >= 820 ? 1.08 :
    width >= 768 ? 1.05 :
    width < 360 ? 0.92 :
    1;
  const sizes = {
    sm: { w: 164, h: 214 },
    md: { w: 192, h: 244 },
    lg: { w: 220, h: 280 },
  }[size];
  const cardWidth = Math.round(sizes.w * scale);
  const cardHeight = Math.round(sizes.h * scale);

  return (
    <TVTouchable
      onPress={onPress}
      style={{ 
        width: cardWidth, 
        marginRight: theme.spacing.md,
        borderRadius: theme.radius.lg,
        overflow: 'hidden'
      }}
      activeOpacity={0.85}
    >
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
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
            height: '50%',
            justifyContent: 'flex-end',
          }}
        >
          <CustomText
            variant="subtitle"
            style={{ 
              color: '#F7F3EA', 
              fontSize: 12,
              lineHeight: 16,
              fontWeight: '600',
              marginBottom: meta || subtitle ? 3 : 0,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </CustomText>
          {meta || subtitle ? (
            <CustomText
              variant="caption"
              style={{ 
                color: 'rgba(232,226,216,0.7)', 
                fontSize: 10.5,
                lineHeight: 14,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {meta ?? subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
    </TVTouchable>
  );
}
