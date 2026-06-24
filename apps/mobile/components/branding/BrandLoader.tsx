import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
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
  const logoSize = size === 'sm' ? 18 : 28;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <View
        style={{
          width: logoSize + 10,
          height: logoSize + 10,
          borderRadius: (logoSize + 10) / 2,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
          backgroundColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../assets/images/ClaudyGoLogo.webp')}
          style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
    </View>
  );
}
