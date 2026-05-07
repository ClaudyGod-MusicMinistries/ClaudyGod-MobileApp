import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

interface AuthBrandPanelProps { salutation: string; description: string; compact?: boolean; }

export function AuthBrandPanel({ salutation, description, compact = false }: AuthBrandPanelProps) {
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={BRAND_LOGO_ASSET} style={{ width: 26, height: 26, borderRadius: 8 }} />
        </View>
        <View style={{ flex: 1 }}>
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.64)', textTransform: 'uppercase', letterSpacing: 0.82 }}>ClaudyGod</CustomText>
          <CustomText variant="label" style={{ color: '#FFFFFF', marginTop: 2 }}>Music & ministry</CustomText>
        </View>
      </View>
    );
  }
  return (
    <LinearGradient colors={['rgba(34,25,55,0.96)', 'rgba(12,8,22,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 24, minHeight: 360, justifyContent: 'space-between', overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: 220, backgroundColor: 'rgba(183,148,246,0.22)' }} />
      <View>
        <View style={{ width: 58, height: 58, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={BRAND_LOGO_ASSET} style={{ width: 34, height: 34, borderRadius: 10 }} />
        </View>
        <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.66)', marginTop: 22, textTransform: 'uppercase', letterSpacing: 0.88 }}>ClaudyGod</CustomText>
        <CustomText variant="display" style={{ color: '#FFFFFF', marginTop: 10, maxWidth: 360 }}>{salutation}</CustomText>
        <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.70)', marginTop: 12, maxWidth: 360 }}>{description}</CustomText>
      </View>
      <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.52)' }}>Music, worship, videos, and live moments in one place.</CustomText>
    </LinearGradient>
  );
}
