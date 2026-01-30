// components/sections/HeroBanner.tsx
import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface HeroBannerProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  onPlay?: () => void;
  onSave?: () => void;
}

export function HeroBanner({ imageUrl, title, subtitle, onPlay, onSave }: HeroBannerProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.card,
      }}
    >
      <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.8)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
      />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        <CustomText className="font-bold" style={{ color: '#FFFFFF', fontSize: 24 }}>
          {title}
        </CustomText>
        <CustomText style={{ color: '#E5E7EB', marginTop: 6 }}>{subtitle}</CustomText>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity
            onPress={onPlay}
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: theme.radius.pill,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialIcons name="play-arrow" size={20} color={theme.colors.text.inverse} />
            <CustomText style={{ color: theme.colors.text.inverse, fontWeight: '700' }}>
              Play
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            style={{
              backgroundColor: 'rgba(0,0,0,0.45)',
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: theme.radius.pill,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
            <CustomText style={{ color: '#FFFFFF', fontWeight: '700' }}>
              Save
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

