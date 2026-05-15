import React from 'react';
import { Image, ImageBackground, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../../util/brandAssets';

interface AuthBrandPanelProps {
  salutation: string;
  description: string;
  compact?: boolean;
}

export function AuthBrandPanel({ salutation, description, compact = false }: AuthBrandPanelProps) {
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 28, height: 28, borderRadius: 9 }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.66)', textTransform: 'uppercase', letterSpacing: 0.82 }}>
            ClaudyGod
          </CustomText>
          <CustomText variant="label" style={{ color: '#FFFFFF', marginTop: 2 }} numberOfLines={1}>
            Music & ministry
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={LANDING_BG_ASSET}
      resizeMode="cover"
      imageStyle={{ opacity: 0.88 }}
      style={{
        flex: 1,
        minHeight: 500,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#120D20',
      }}
    >
      <LinearGradient
        colors={['rgba(34,25,55,0.45)', 'rgba(12,8,22,0.72)', 'rgba(8,5,15,0.96)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, padding: 28, justifyContent: 'space-between' }}
      >
        <View pointerEvents="none" style={{ position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: 220, backgroundColor: 'rgba(183,148,246,0.24)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -100, left: -70, width: 220, height: 220, borderRadius: 220, backgroundColor: 'rgba(255,255,255,0.08)' }} />

        <View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 23,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              backgroundColor: 'rgba(255,255,255,0.09)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 38, height: 38, borderRadius: 12 }} />
          </View>

          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.70)', marginTop: 24, textTransform: 'uppercase', letterSpacing: 0.88 }}>
            ClaudyGod
          </CustomText>
          <CustomText variant="display" style={{ color: '#FFFFFF', marginTop: 10, maxWidth: 410, fontSize: 38, lineHeight: 45 }}>
            {salutation}
          </CustomText>
          <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.74)', marginTop: 14, maxWidth: 390, lineHeight: 23 }}>
            {description}
          </CustomText>
        </View>

        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.20)',
            backgroundColor: 'rgba(0,0,0,0.42)',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Music, worship, videos, and live moments in one place.
          </CustomText>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
