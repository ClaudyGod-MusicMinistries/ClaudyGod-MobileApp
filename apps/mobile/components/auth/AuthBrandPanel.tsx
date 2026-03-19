import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, View } from 'react-native';
import { CustomText } from '../CustomText';

interface AuthBrandPanelProps {
  salutation: string;
  description: string;
}

export function AuthBrandPanel({ salutation, description }: AuthBrandPanelProps) {
  const highlights = ['Secure access', 'Recovery ready', 'Live ministry visuals'];

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

      <View
        style={{
          marginTop: 15,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      >
        <Image
          source={require('../../assets/images/landing4.jpg')}
          style={{ width: '100%', height: 154 }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(10,7,20,0.05)', 'rgba(8,7,14,0.82)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 14,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <CustomText variant="caption" style={{ color: 'rgba(238,231,255,0.82)' }}>
              Ministry experience
            </CustomText>
            <CustomText
              variant="label"
              style={{ color: '#FAF7FF', marginTop: 4, fontSize: 12.6, lineHeight: 16 }}
            >
              Beautiful worship visuals, secure flows, and a calmer account journey.
            </CustomText>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                width: 54,
                height: 70,
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <Image
                source={require('../../assets/images/FB_IMG_1743103252303.jpg')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <View
              style={{
                width: 54,
                height: 70,
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <Image
                source={require('../../assets/images/music4.webp')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </View>
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
