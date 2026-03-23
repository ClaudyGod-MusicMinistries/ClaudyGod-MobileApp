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
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} style={{ width: 24, height: 24, borderRadius: 6 }} />
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
      colors={['rgba(18,23,28,0.94)', 'rgba(10,13,17,0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 18,
        minHeight: 280,
        justifyContent: 'flex-start',
      }}
    >
      <View>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} style={{ width: 30, height: 30, borderRadius: 8 }} />
        </View>

        <CustomText
          variant="caption"
          style={{
            color: 'rgba(226,214,192,0.72)',
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
            marginTop: 8,
            fontSize: 20,
            lineHeight: 25,
          }}
        >
          {salutation}
        </CustomText>

        <CustomText
          variant="body"
          style={{
            color: 'rgba(194,203,210,0.78)',
            marginTop: 10,
            maxWidth: 320,
          }}
        >
          {description}
        </CustomText>
      </View>
    </LinearGradient>
  );
}
