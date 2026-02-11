// components/sections/HeroBanner.tsx
import React from 'react';
import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { AppButton } from '../ui/AppButton';

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
      <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 210 }} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.8)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }}
      />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        <CustomText variant="heading" style={{ color: '#FFFFFF' }}>
          {title}
        </CustomText>
        <CustomText variant="body" style={{ color: '#E5E7EB', marginTop: 6 }}>
          {subtitle}
        </CustomText>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <AppButton
            title="Play"
            variant="primary"
            size="sm"
            onPress={onPlay}
            leftIcon={<MaterialIcons name="play-arrow" size={18} color={theme.colors.text.inverse} />}
            style={{ marginRight: 10 }}
          />
          <AppButton
            title="Save"
            variant="outline"
            size="sm"
            onPress={onSave}
            leftIcon={<MaterialIcons name="add" size={18} color="#FFFFFF" />}
            textColor="#FFFFFF"
            style={{
              borderColor: 'rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
          />
        </View>
      </View>
    </View>
  );
}
