import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../../util/brandAssets';
import { useDeviceClass } from '../../util/deviceClassConfig';
interface AuthBrandPanelProps {
  salutation: string;
  description: string;
  compact?: boolean;
}

export function AuthBrandPanel({ salutation, description, compact = false }: AuthBrandPanelProps) {
  const device = useDeviceClass();

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
            Music, worship, videos, and live moments
          </CustomText>
        </View>
      </View>
    );
  }

  const minHeight = device.isTV ? 620 : device.isDesktop ? 540 : 420;
  const titleSize = device.isTV ? 48 : device.isDesktop ? 40 : 32;

  return (
    <View
      style={{
        flex: 1,
        minHeight,
        borderRadius: device.isTV ? 40 : 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: '#120D20',
      }}
    >
      <LinearGradient
        colors={['rgba(34,25,55,0.98)', 'rgba(12,8,22,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Image
        source={LANDING_BG_ASSET}
        resizeMode="contain"
        style={{
          position: 'absolute',
          top: 18,
          right: -10,
          bottom: 18,
          width: '58%',
          height: '94%',
          opacity: 0.72,
        }}
      />

      <LinearGradient
        colors={['rgba(16,10,28,0.15)', 'rgba(16,10,28,0.66)', 'rgba(8,5,15,0.98)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 1 }}
        style={{ flex: 1, padding: device.isTV ? 36 : 28, justifyContent: 'space-between' }}
      >
        <View style={{ position: 'absolute', top: -90, right: -90, width: 240, height: 240, borderRadius: 240, backgroundColor: 'rgba(183,148,246,0.24)', pointerEvents: 'none' }} />
        <View style={{ position: 'absolute', bottom: -110, left: -80, width: 240, height: 240, borderRadius: 240, backgroundColor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

        <View style={{ maxWidth: device.isTV ? 540 : 430 }}>
          <View
            style={{
              width: device.isTV ? 76 : 64,
              height: device.isTV ? 76 : 64,
              borderRadius: device.isTV ? 27 : 23,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              backgroundColor: 'rgba(255,255,255,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: device.isTV ? 46 : 38, height: device.isTV ? 46 : 38, borderRadius: 12 }} />
          </View>

          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.72)', marginTop: 26, textTransform: 'uppercase', letterSpacing: 0.88 }}>
            ClaudyGod
          </CustomText>
          <CustomText variant="display" style={{ color: '#FFFFFF', marginTop: 10, maxWidth: 450, fontSize: titleSize, lineHeight: titleSize * 1.16 }}>
            {salutation}
          </CustomText>
          <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.76)', marginTop: 14, maxWidth: 410, lineHeight: device.isTV ? 27 : 23, fontSize: device.isTV ? 17 : undefined }}>
            {description}
          </CustomText>
        </View>

        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.22)',
            backgroundColor: 'rgba(0,0,0,0.44)',
            paddingHorizontal: 13,
            paddingVertical: 8,
          }}
        >
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Music, worship, videos, and live moments in one place.
          </CustomText>
        </View>
      </LinearGradient>
    </View>
  );
}
