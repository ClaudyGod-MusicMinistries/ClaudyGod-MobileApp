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
            width: 48,
            height: 48,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(183,148,246,0.30)',
            backgroundColor: 'rgba(183,148,246,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 30, height: 30, borderRadius: 10 }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="caption" style={{ color: 'rgba(183,148,246,0.90)', textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 10 }}>
            ClaudyGod
          </CustomText>
          <CustomText variant="label" style={{ color: '#FFFFFF', marginTop: 2, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
            Music · Worship · Live Ministry
          </CustomText>
        </View>
      </View>
    );
  }

  const minHeight = device.isTV ? 620 : device.isDesktop ? 540 : 440;
  const titleSize = device.isTV ? 48 : device.isDesktop ? 40 : 33;

  return (
    <View
      style={{
        flex: 1,
        minHeight,
        borderRadius: device.isTV ? 40 : 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(183,148,246,0.22)',
        backgroundColor: '#0D0919',
      }}
    >
      {/* Cinematic full-cover worship image */}
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
          opacity: 0.62,
        }}
      />

      {/* Rich deep gradient overlay */}
      <LinearGradient
        colors={[
          'rgba(8,4,18,0.22)',
          'rgba(10,6,22,0.48)',
          'rgba(8,4,16,0.86)',
          'rgba(6,3,14,0.98)',
        ]}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Left-side purple glow accent */}
      <LinearGradient
        colors={['rgba(124,58,237,0.28)', 'rgba(124,58,237,0)']}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0.6, y: 0.3 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
      />

      {/* Content */}
      <View style={{ flex: 1, padding: device.isTV ? 38 : 30, justifyContent: 'space-between' }}>
        {/* Top: Logo + brand */}
        <View>
          <View
            style={{
              width: device.isTV ? 76 : 64,
              height: device.isTV ? 76 : 64,
              borderRadius: device.isTV ? 27 : 22,
              borderWidth: 1.5,
              borderColor: 'rgba(183,148,246,0.40)',
              backgroundColor: 'rgba(183,148,246,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#B794F6',
              shadowOpacity: 0.35,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: device.isTV ? 46 : 38, height: device.isTV ? 46 : 38, borderRadius: 12 }} />
          </View>

          <CustomText variant="caption" style={{ color: 'rgba(199,168,255,0.82)', marginTop: 24, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11 }}>
            ClaudyGod
          </CustomText>
        </View>

        {/* Middle: Hero text */}
        <View style={{ maxWidth: device.isTV ? 540 : 430 }}>
          <CustomText variant="display" style={{ color: '#FFFFFF', fontSize: titleSize, lineHeight: titleSize * 1.14, fontWeight: '800', letterSpacing: -0.8 }}>
            {salutation}
          </CustomText>
          <CustomText variant="body" style={{ color: 'rgba(220,208,248,0.80)', marginTop: 14, maxWidth: 410, lineHeight: device.isTV ? 28 : 24, fontSize: device.isTV ? 17 : 15 }}>
            {description}
          </CustomText>

          {/* Feature chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
            {(['Worship Music', 'Live Sessions', 'Video Messages', 'Daily Word'] as const).map((label) => (
              <View
                key={label}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(183,148,246,0.30)',
                  backgroundColor: 'rgba(183,148,246,0.10)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <CustomText variant="caption" style={{ color: 'rgba(199,168,255,0.90)', fontSize: 11, fontWeight: '600' }}>
                  {label}
                </CustomText>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom tagline */}
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
            backgroundColor: 'rgba(0,0,0,0.38)',
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.76)', lineHeight: 18, fontSize: 12 }}>
            Music, worship, videos, and live moments{'\n'}in one focused space.
          </CustomText>
        </View>
      </View>
    </View>
  );
}
