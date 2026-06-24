import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface BrandLoaderProps {
  label?: string;
  size?: 'sm' | 'md';
  textColor?: string;
}

export function BrandLoader({
  label,
  size = 'md',
  textColor,
}: BrandLoaderProps) {
  const theme = useAppTheme();
  const color = textColor ?? theme.colors.text;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <ActivityIndicator size="small" color={color} />
      {label ? (
        <CustomText
          variant={size === 'sm' ? 'label' : 'subtitle'}
          style={{ color }}
          numberOfLines={1}
        >
          {label}
        </CustomText>
      ) : null}
    </View>
  );
}
