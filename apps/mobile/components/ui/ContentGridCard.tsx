/**
 * Beautiful Content Grid Card
 * Displays content items in a clean grid with image and metadata
 */

import React, { useState } from 'react';
import { Image, Pressable, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';

interface ContentGridCardProps {
  id: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  size?: 'small' | 'medium';
}

const COLORS = {
  accent: '#A78BFA',
  textPrimary: '#F5F3FF',
  textSecondary: 'rgba(184,180,212,0.70)',
  surface: 'rgba(26,20,47,0.50)',
  border: 'rgba(167,139,250,0.15)',
};

export function ContentGridCard({
  id: _id,
  imageUrl,
  title,
  subtitle,
  onPress,
  size = 'medium',
}: ContentGridCardProps) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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

  const imageHeight = size === 'small' ? 140 : 180;

  return (
    <Animated.View
      style={{
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        transform: [{ scale: scaleAnim }],
        shadowColor: '#000',
        shadowOpacity: pressed ? 0.3 : 0.15,
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
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: pressed ? COLORS.border : COLORS.surface,
          borderWidth: 1,
          borderColor: pressed ? COLORS.accent : COLORS.border,
        }}
      >
        {/* Image Section */}
        <View
          style={{
            height: imageHeight,
            backgroundColor: pressed ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            <>
              <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,6,18,0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
              />
            </>
          ) : (
            <MaterialIcons name="music-note" size={32} color={COLORS.accent} />
          )}

          {/* Play Button Overlay */}
          <View
            style={{
              position: 'absolute',
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(167,139,250,0.9)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 1 : 0.8,
            }}
          >
            <MaterialIcons name="play-arrow" size={20} color={COLORS.textPrimary} />
          </View>
        </View>

        {/* Text Section */}
        <View style={{ padding: 10 }}>
          <CustomText
            numberOfLines={2}
            style={{
              color: COLORS.textPrimary,
              fontSize: size === 'small' ? 12 : 13,
              fontWeight: '600',
              marginBottom: subtitle ? 4 : 0,
              lineHeight: 16,
            }}
          >
            {title}
          </CustomText>

          {subtitle && (
            <CustomText
              numberOfLines={1}
              style={{
                color: COLORS.textSecondary,
                fontSize: 11,
              }}
            >
              {subtitle}
            </CustomText>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
