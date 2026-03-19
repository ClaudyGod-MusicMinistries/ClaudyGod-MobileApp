import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, View } from 'react-native';
import { CustomText } from '../CustomText';

interface AuthBrandPanelProps {
  salutation: string;
  description: string;
}

export function AuthBrandPanel({ salutation, description }: AuthBrandPanelProps) {
  const highlights = ['Secure access', 'Responsive layout', 'Recovery ready'];

  return (
    <View
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(235,226,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.028)',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <LinearGradient
            colors={['rgba(169,123,255,0.42)', 'rgba(68,200,255,0.16)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Image
              source={require('../../assets/images/ClaudyGoLogo.webp')}
              style={{ width: 34, height: 34, borderRadius: 17 }}
            />
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <CustomText
              variant="caption"
              style={{
                color: 'rgba(216,205,246,0.78)',
                textTransform: 'uppercase',
                letterSpacing: 0.68,
                fontSize: 10,
                lineHeight: 12,
              }}
            >
              ClaudyGod Ministries
            </CustomText>
            <CustomText
              variant="label"
              style={{ color: '#F9F7FF', marginTop: 4, fontSize: 12.2, lineHeight: 16 }}
            >
              Worship archive, account access, and ministry updates
            </CustomText>
          </View>
        </View>

        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(160,255,210,0.20)',
            backgroundColor: 'rgba(74,181,121,0.12)',
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}
        >
          <CustomText variant="caption" style={{ color: '#D5FFE8', fontSize: 10.2, lineHeight: 12 }}>
            Protected
          </CustomText>
        </View>
      </View>

      <CustomText
        variant="heading"
        style={{ color: '#F8F7FC', marginTop: 16, fontSize: 16, lineHeight: 21 }}
      >
        {salutation}
      </CustomText>
      <CustomText
        variant="body"
        style={{ color: 'rgba(203,196,226,0.84)', marginTop: 7, fontSize: 12.8, lineHeight: 18 }}
      >
        {description}
      </CustomText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }}>
        {highlights.map((item) => (
          <View
            key={item}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.035)',
              paddingHorizontal: 9,
              paddingVertical: 5,
            }}
          >
            <CustomText
              variant="caption"
              style={{ color: 'rgba(232,225,249,0.88)', fontSize: 10.2, lineHeight: 12 }}
            >
              {item}
            </CustomText>
          </View>
        ))}
      </View>
    </View>
  );
}
