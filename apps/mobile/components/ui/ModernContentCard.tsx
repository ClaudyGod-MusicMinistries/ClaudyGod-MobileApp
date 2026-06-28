import React, { useState, useRef } from 'react';
import { View, Image, Platform, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
    case 'sm':  return { imageHeight: 96,  imageWidth: 96,  fontSize: 10, gap: 4 };
    case 'lg':  return { imageHeight: 160, imageWidth: 160, fontSize: 12, gap: 6 };
    default:    return { imageHeight: 124, imageWidth: 124, fontSize: 11, gap: 5 };
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
  const theme = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.timing(scaleAnim, {
      toValue: theme.interaction.pressScale,
      duration: theme.timing.fast,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: theme.timing.moderate,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  void pressed;

  const dims = getCardDimensions(size);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        borderRadius: theme.radius.md,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.elevated,
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
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="music-note" size={dims.fontSize * 1.5} color={theme.colors.accent} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', `rgba(0,0,0,0.7)`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />

          {badge ? (
            <View
              style={{
                position: 'absolute',
                top: theme.spacing.xs,
                right: theme.spacing.xs,
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.xs,
                paddingVertical: 2,
                borderRadius: theme.radius.sm,
                zIndex: 10,
              }}
            >
              <CustomText variant="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {badge}
              </CustomText>
            </View>
          ) : null}

          {onPlayPress ? (
            <Pressable
              onPress={onPlayPress}
              style={{
                position: 'absolute',
                width: theme.spacing.xxl,
                height: theme.spacing.xxl,
                borderRadius: theme.spacing.xxl / 2,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                top: '50%',
                left: '50%',
                marginTop: -(theme.spacing.xxl / 2),
                marginLeft: -(theme.spacing.xxl / 2),
              }}
            >
              <MaterialIcons
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={dims.fontSize}
                color="#FFFFFF"
              />
            </Pressable>
          ) : null}
        </View>

        {/* Info Container */}
        <View style={{ padding: size === 'sm' ? theme.spacing.xs : theme.spacing.sm }}>
          <CustomText
            numberOfLines={2}
            style={{
              color: theme.colors.text,
              fontSize: dims.fontSize,
              fontWeight: '600',
              marginBottom: theme.spacing.xs,
            }}
          >
            {title}
          </CustomText>

          {subtitle ? (
            <CustomText
              numberOfLines={1}
              style={{
                color: theme.colors.textSecondary,
                fontSize: dims.fontSize * 0.85,
                marginBottom: theme.spacing.xs,
              }}
            >
              {subtitle}
            </CustomText>
          ) : null}

          {author ? (
            <CustomText
              numberOfLines={1}
              style={{ color: theme.colors.textSecondary, fontSize: 9, marginBottom: 6 }}
            >
              {author}
            </CustomText>
          ) : null}

          {(plays !== undefined || likes !== undefined || duration) ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {plays !== undefined ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="play-circle-outline" size={12} color={theme.colors.textSecondary} />
                  <CustomText style={{ color: theme.colors.textSecondary, fontSize: 10 }}>
                    {plays > 1000 ? (plays / 1000).toFixed(1) + 'K' : plays}
                  </CustomText>
                </View>
              ) : null}
              {likes !== undefined ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="favorite-border" size={12} color={theme.colors.textSecondary} />
                  <CustomText style={{ color: theme.colors.textSecondary, fontSize: 10 }}>
                    {likes > 1000 ? (likes / 1000).toFixed(1) + 'K' : likes}
                  </CustomText>
                </View>
              ) : null}
              {duration ? (
                <CustomText style={{ color: theme.colors.textSecondary, fontSize: 10 }}>
                  {duration}
                </CustomText>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
