import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../CustomText';

interface AuthFeedbackBannerProps {
  message: string;
  tone?: 'error' | 'success' | 'info';
}

export function AuthFeedbackBanner({
  message,
  tone = 'info',
}: AuthFeedbackBannerProps) {
  const palette =
    tone === 'error'
      ? {
          borderColor: 'rgba(255,120,120,0.22)',
          backgroundColor: 'rgba(255,80,80,0.08)',
          textColor: '#FFD6D6',
        }
      : tone === 'success'
        ? {
            borderColor: 'rgba(122,230,166,0.30)',
            backgroundColor: 'rgba(56,170,104,0.14)',
            textColor: '#D4FFE4',
          }
        : {
            borderColor: 'rgba(156,125,255,0.24)',
            backgroundColor: 'rgba(107,79,188,0.12)',
            textColor: '#E4D8FF',
          };

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: palette.borderColor,
        backgroundColor: palette.backgroundColor,
        paddingHorizontal: 13,
        paddingVertical: 11,
      }}
    >
      <CustomText variant="caption" style={{ color: palette.textColor }}>
        {message}
      </CustomText>
    </View>
  );
}
