import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

interface AuthBrandPanelProps {
  salutation: string;
  description: string;
  compact?: boolean;
}

export function AuthBrandPanel({
  salutation,
  description,
  compact = false,
}: AuthBrandPanelProps) {
  if (compact) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} style={{ width: 28, height: 28, borderRadius: 14 }} />
        </View>

        <View style={{ flex: 1 }}>
          <CustomText
            variant="caption"
            style={{
              color: 'rgba(224,214,197,0.68)',
              textTransform: 'uppercase',
              letterSpacing: 0.72,
            }}
          >
            ClaudyGod
          </CustomText>
          <CustomText variant="label" style={{ color: '#FFF9F0', marginTop: 2 }}>
            Account
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(185,144,68,0.18)', 'rgba(17,20,30,0.88)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 22,
        minHeight: 360,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} style={{ width: 38, height: 38, borderRadius: 19 }} />
        </View>

        <CustomText
          variant="caption"
          style={{
            color: 'rgba(224,214,197,0.72)',
            marginTop: 18,
            textTransform: 'uppercase',
            letterSpacing: 0.88,
          }}
        >
          ClaudyGod account
        </CustomText>

        <CustomText
          variant="display"
          style={{
            color: '#FFF9F0',
            marginTop: 10,
            fontSize: 28,
            lineHeight: 34,
          }}
        >
          {salutation}
        </CustomText>

        <CustomText
          variant="body"
          style={{
            color: 'rgba(239,232,222,0.74)',
            marginTop: 10,
            maxWidth: 320,
          }}
        >
          {description}
        </CustomText>
      </View>

      <View
        style={{
          borderRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          padding: 16,
        }}
      >
        <CustomText variant="label" style={{ color: '#FFF9F0' }}>
          One place for music, video, and saved listening.
        </CustomText>
        <CustomText
          variant="caption"
          style={{ color: 'rgba(224,214,197,0.72)', marginTop: 6 }}
        >
          Clean access on every screen without the extra clutter.
        </CustomText>
      </View>
    </LinearGradient>
  );
}
