import React from 'react';
import { Image, View } from 'react-native';
import { CustomText } from '../CustomText';

interface AuthBrandPanelProps {
  salutation: string;
  description: string;
}

export function AuthBrandPanel({ salutation, description }: AuthBrandPanelProps) {
  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(235,226,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Image
            source={require('../../assets/images/ClaudyGoLogo.webp')}
            style={{ width: 34, height: 34, borderRadius: 17 }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <CustomText variant="caption" style={{ color: 'rgba(216,205,246,0.86)' }}>
            ClaudyGod Music Ministries
          </CustomText>
          <CustomText variant="label" style={{ color: '#F9F7FF', marginTop: 3 }}>
            Worship • Messages • Nuggets of Truth
          </CustomText>
        </View>
      </View>

      <CustomText variant="heading" style={{ color: '#F8F7FC', marginTop: 16 }}>
        {salutation}
      </CustomText>
      <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 6 }}>
        {description}
      </CustomText>
    </View>
  );
}
