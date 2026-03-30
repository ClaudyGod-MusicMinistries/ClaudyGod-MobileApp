/**
 * Beautiful Featured Content Card
 * Displays featured content with image, title, and metadata
 */

import React, { useState } from 'react';
import { Image, Pressable, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { colors_light } from '../../constants/color';
import { spacing, radius, shadows } from '../../styles/designTokens';

interface FeaturedCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
  height?: number;
}

export function FeaturedCard({
  imageUrl,
  title,
  subtitle,
  badge,
  onPress,
  height = 280,
}: FeaturedCardProps) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        width: '100%',
        height,
        borderRadius: radius.xl,
        overflow: 'hidden',
        transform: [{ scale: scaleAnim }],
        shadowColor: '#000',
        shadowOpacity: pressed ? 0.4 : 0.2,
        shadowRadius: shadows.card.shadowRadius,
        shadowOffset: shadows.card.shadowOffset,
        elevation: 8,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: `rgba(${colors_light.accentRgba ?? '167,139,250'},0.1)` }} />
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Badge */}
        {badge && (
          <View
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              backgroundColor: colors_light.accent,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.sm,
              zIndex: 10,
            }}
          >
            <CustomText style={{ color: colors_light.background, fontSize: 10, fontWeight: '700' }}>{badge}</CustomText>
          </View>
        )}

        {/* Content */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.lg,
            justifyContent: 'flex-end',
          }}
        >
          <CustomText
            numberOfLines={2}
            style={{
              color: colors_light.text,
              fontSize: 18,
              fontWeight: '700',
              marginBottom: spacing.xs,
              lineHeight: 24,
            }}
          >
            {title}
          </CustomText>

          {subtitle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <MaterialIcons name="play-circle-filled" size={14} color={colors_light.accent} />
              <CustomText
                numberOfLines={1}
                style={{
                  color: colors_light.textSecondary,
                  fontSize: 12,
                }}
              >
                {subtitle}
              </CustomText>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
