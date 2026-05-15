import React from 'react';
import { Image, View } from 'react-native';
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.16)',
            backgroundColor: 'rgba(255,255,255,0.09)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 28, height: 28, borderRadius: 9 }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.70)', textTransform: 'uppercase', letterSpacing: 0.82 }}>
            ClaudyGod
          </CustomText>
          <CustomText variant="label" style={{ color: '#FFFFFF', marginTop: 2 }} numberOfLines={1}>
            Secure worship account
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(31,22,52,0.98)', 'rgba(13,8,24,0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        minHeight: 520,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 26,
        justifyContent: 'space-between',
        backgroundColor: '#120D20',
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', top: -90, right: -82, width: 230, height: 230, borderRadius: 230, backgroundColor: 'rgba(183,148,246,0.22)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -110, left: -80, width: 240, height: 240, borderRadius: 240, backgroundColor: 'rgba(125,211,252,0.10)' }} />

      <View>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 23,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.17)',
            backgroundColor: 'rgba(255,255,255,0.10)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 38, height: 38, borderRadius: 12 }} />
        </View>

        <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.72)', marginTop: 22, textTransform: 'uppercase', letterSpacing: 0.88 }}>
          ClaudyGod
        </CustomText>
        <CustomText variant="display" style={{ color: '#FFFFFF', marginTop: 10, maxWidth: 410, fontSize: 38, lineHeight: 45 }}>
          {salutation}
        </CustomText>
        <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.76)', marginTop: 14, maxWidth: 390, lineHeight: 23 }}>
          {description}
        </CustomText>
      </View>

      <View
        style={{
          height: 250,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          backgroundColor: 'rgba(255,255,255,0.06)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          source={LANDING_BG_ASSET}
          resizeMode="contain"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(8,5,15,0.0)', 'rgba(8,5,15,0.36)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }}
        />
      </View>
    </LinearGradient>
  );
}
