import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
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
      Animated.timing(scaleAnim, { toValue: theme.interaction.pressScale, duration: theme.timing.fast, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacityAnim, { toValue: 0.9, duration: theme.timing.fast, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(playButtonScaleAnim, { toValue: 1.1, duration: theme.timing.fast, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: theme.timing.moderate, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacityAnim, { toValue: 1, duration: theme.timing.moderate, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(playButtonScaleAnim, { toValue: 1, duration: theme.timing.moderate, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  void pressed;

  return (
    <Animated.View
      style={{
        width: '100%',
        height,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
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
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.primarySurface }]} />
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.75)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.lg,
              right: theme.spacing.lg,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              zIndex: 10,
            }}
          >
            <CustomText style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{badge}</CustomText>
          </View>
        ) : null}

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

        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
            justifyContent: 'flex-end',
          }}
        >
          <CustomText
            numberOfLines={2}
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
              marginBottom: theme.spacing.md,
              lineHeight: 28,
            }}
          >
            {title}
          </CustomText>

          {subtitle ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <MaterialIcons name="verified" size={16} color={theme.colors.accent} />
              <CustomText
                numberOfLines={1}
                style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' }}
              >
                {subtitle}
              </CustomText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
