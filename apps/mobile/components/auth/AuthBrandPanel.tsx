import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { BRAND_LOGO_ASSET, BRAND_WORSHIP_ASSET } from '../../util/brandAssets';
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: '#1A1A1A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 28, height: 28, borderRadius: 8 }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="caption" style={{ color: 'rgba(183,148,246,0.90)', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 10 }}>
            ClaudyGod
          </CustomText>
          <CustomText variant="label" style={{ color: '#F7F2FF', marginTop: 2, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            Music · Worship · Live Ministry
          </CustomText>
        </View>
      </View>
    );
  }

  const minHeight = device.isTV ? 620 : device.isDesktop ? 540 : 440;
  const titleSize = device.isTV ? 40 : device.isDesktop ? 33 : 28;

  return (
    <View
      style={{
        flex: 1,
        minHeight,
        borderRadius: device.isTV ? 32 : 24,
        overflow: 'hidden',
        backgroundColor: '#0D0919',
      }}
    >
      {/* Worship image */}
      <Image
        source={BRAND_WORSHIP_ASSET}
        resizeMode="cover"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          opacity: 0.55,
        }}
      />

      {/* Bottom scrim for text readability — allowed on image containers */}
      <LinearGradient
        colors={['rgba(7,5,12,0)', 'rgba(7,5,12,0.72)', 'rgba(7,5,12,0.98)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' }}
      />

      {/* Content */}
      <View style={{ flex: 1, padding: device.isTV ? 36 : 28, justifyContent: 'space-between' }}>
        {/* Logo */}
        <View
          style={{
            width: device.isTV ? 64 : 54,
            height: device.isTV ? 64 : 54,
            borderRadius: device.isTV ? 22 : 18,
            backgroundColor: '#1A1A1A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: device.isTV ? 40 : 34, height: device.isTV ? 40 : 34, borderRadius: 10 }} />
        </View>

        {/* Hero text */}
        <View style={{ maxWidth: device.isTV ? 500 : 400 }}>
          <CustomText variant="display" style={{ color: '#F7F2FF', fontSize: titleSize, lineHeight: titleSize * 1.15, fontWeight: '700', letterSpacing: -0.5 }}>
            {salutation}
          </CustomText>
          <CustomText variant="body" style={{ color: '#9287AD', marginTop: 10, lineHeight: device.isTV ? 24 : 20, fontSize: device.isTV ? 14 : 13 }}>
            {description}
          </CustomText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {(['Worship Music', 'Live Sessions', 'Video Messages', 'Daily Word'] as const).map((label) => (
              <View
                key={label}
                style={{
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}
              >
                <CustomText variant="caption" style={{ color: 'rgba(199,168,255,0.90)', fontSize: 11, fontWeight: '600' }}>
                  {label}
                </CustomText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
