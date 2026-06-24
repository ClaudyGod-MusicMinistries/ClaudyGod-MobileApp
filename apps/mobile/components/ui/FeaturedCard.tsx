/**
 * Beautiful Featured Content Card
 * Displays featured content with image, title, and metadata
 * Enhanced with modern animations and professional styling
 */

import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { colors_light } from '../../constants/color';
import { spacing} from '../../styles/designTokens';
import { designSystem } from '../../theme/designSystem';
import { useAppTheme } from '../../util/colorScheme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
  const theme = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;
  const playButtonScaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: designSystem.timing.fast,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: designSystem.timing.fast,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(playButtonScaleAnim, {
        toValue: 1.1,
        duration: designSystem.timing.fast,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: designSystem.timing.moderate,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: designSystem.timing.moderate,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(playButtonScaleAnim, {
        toValue: 1,
        duration: designSystem.timing.moderate,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        width: '100%',
        height,
        borderRadius: designSystem.radius.xl,
        overflow: 'hidden',
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        shadowColor: '#000',
        shadowOpacity: pressed ? 0.35 : 0.15,
        shadowRadius: pressed ? 20 : 12,
        shadowOffset: { width: 0, height: pressed ? 8 : 4 },
        elevation: pressed ? 12 : 6,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(139,92,246,0.1)' }]} />
        )}

        {/* Enhanced Gradient Overlay - more dramatic */}
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.75)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Badge */}
        {badge && (
          <View
            style={{
              position: 'absolute',
              top: spacing.lg,
              right: spacing.lg,
              backgroundColor: 'rgba(34, 211, 238, 0.95)',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: designSystem.radius.sm,
              zIndex: 10,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <CustomText style={{ color: colors_light.background, fontSize: 11, fontWeight: '700' }}>{badge}</CustomText>
          </View>
        )}

        {/* Play Button */}
        <Animated.View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginLeft: -32,
            marginTop: -32,
            zIndex: 5,
            transform: [{ scale: playButtonScaleAnim }],
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="play-arrow" size={28} color={theme.colors.onPrimary} />
          </View>
        </Animated.View>

        {/* Content */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            justifyContent: 'flex-end',
          }}
        >
          <CustomText
            numberOfLines={2}
            style={{
              color: colors_light.text,
              fontSize: 20,
              fontWeight: '700',
              marginBottom: spacing.md,
              lineHeight: 28,
            }}
          >
            {title}
          </CustomText>

          {subtitle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <MaterialIcons name="verified" size={16} color={colors_light.accent} />
              <CustomText
                numberOfLines={1}
                style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: 13,
                  fontWeight: '500',
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
