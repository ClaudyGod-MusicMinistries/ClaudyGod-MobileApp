/**
 * Modern Content Card Component
 * Beautiful, reusable card for displaying content with smooth interactions
 * Enhanced with design system tokens and premium animations
 */

import React, { useState, useRef } from 'react';
import { View, Image, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { colors_light } from '../../constants/color';
import { spacing, radius } from '../../styles/designTokens';
import { designSystem } from '../../theme/designSystem';

interface ModernContentCardProps {
  id: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  author?: string;
  plays?: number;
  likes?: number;
  duration?: string;
  isPlaying?: boolean;
  onPress: () => void;
  onPlayPress?: () => void;
  badge?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getCardDimensions = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return { imageHeight: 96, imageWidth: 96, fontSize: 10, gap: 4 };
    case 'lg':
      return { imageHeight: 160, imageWidth: 160, fontSize: 12, gap: 6 };
    default:
      return { imageHeight: 124, imageWidth: 124, fontSize: 11, gap: 5 };
  }
};

export function ModernContentCard({
  id: _id,
  imageUrl,
  title,
  subtitle,
  author,
  plays,
  likes,
  duration,
  isPlaying = false,
  onPress,
  onPlayPress,
  badge,
  size = 'md',
}: ModernContentCardProps) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0.1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: designSystem.interaction.pressScale,
        duration: designSystem.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.25,
        duration: designSystem.timing.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: designSystem.timing.moderate,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.1,
        duration: designSystem.timing.moderate,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dims = getCardDimensions(size);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        borderRadius: designSystem.radius.md,
        shadowColor: '#000',
        shadowOpacity: shadowOpacityAnim,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: designSystem.radius.md,
          overflow: 'hidden',
          backgroundColor: '#111111',
        }}
      >
        {/* Image Container */}
        <View style={{ position: 'relative', width: dims.imageWidth, height: dims.imageHeight }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: colors_light.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name="music-note"
                size={dims.fontSize * 1.5}
                color={colors_light.accent}
              />
            </View>
          )}

          {/* Gradient overlay - subtle and clean */}
          <LinearGradient
            colors={['transparent', `rgba(${colors_light.backgroundRgba ?? '10,6,18'},0.7)`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
          />

          {/* Badge - minimal design */}
          {badge && (
            <View
              style={{
                position: 'absolute',
                top: spacing.xs,
                right: spacing.xs,
                backgroundColor: colors_light.accent,
                paddingHorizontal: spacing.xs,
                paddingVertical: 2,
                borderRadius: radius.sm,
                zIndex: 10,
              }}
            >
              <CustomText
                variant="caption"
                style={{
                  color: colors_light.background,
                  fontWeight: '600',
                }}
              >
                {badge}
              </CustomText>
            </View>
          )}

          {/* Play Button - premium and centered */}
          {onPlayPress && (
            <Pressable
              onPress={onPlayPress}
              style={{
                position: 'absolute',
                width: spacing.xxl,
                height: spacing.xxl,
                borderRadius: spacing.xxl / 2,
                backgroundColor: pressed ? colors_light.accent : colors_light.accent,
                alignItems: 'center',
                justifyContent: 'center',
                top: '50%',
                left: '50%',
                marginTop: -(spacing.xxl / 2),
                marginLeft: -(spacing.xxl / 2),
                shadowColor: colors_light.accent,
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={dims.fontSize}
                color="white"
              />
            </Pressable>
          )}
        </View>

        {/* Info Container */}
        <View style={{ padding: size === 'sm' ? spacing.xs : spacing.sm }}>
          <CustomText
            numberOfLines={2}
            style={{
              color: colors_light.text,
              fontSize: dims.fontSize,
              fontWeight: '600',
              marginBottom: spacing.xs,
            }}
          >
            {title}
          </CustomText>

          {subtitle && (
            <CustomText
              numberOfLines={1}
              style={{
                color: colors_light.textSecondary,
                fontSize: dims.fontSize * 0.85,
                marginBottom: spacing.xs,
              }}
            >
              {subtitle}
            </CustomText>
          )}

          {author && (
            <CustomText
              numberOfLines={1}
              style={{
                color: colors_light.textSecondary,
                fontSize: 9,
                marginBottom: 6,
              }}
            >
              {author}
            </CustomText>
          )}

          {/* Stats Row */}
          {(plays || likes || duration) && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {plays !== undefined && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="play-circle-outline" size={12} color={colors_light.textSecondary} />
                  <CustomText style={{ color: colors_light.textSecondary, fontSize: 10 }}>
                    {plays > 1000 ? (plays / 1000).toFixed(1) + 'K' : plays}
                  </CustomText>
                </View>
              )}
              {likes !== undefined && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="favorite-border" size={12} color={colors_light.textSecondary} />
                  <CustomText style={{ color: colors_light.textSecondary, fontSize: 10 }}>
                    {likes > 1000 ? (likes / 1000).toFixed(1) + 'K' : likes}
                  </CustomText>
                </View>
              )}
              {duration && (
                <CustomText style={{ color: colors_light.textSecondary, fontSize: 10 }}>
                  {duration}
                </CustomText>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
