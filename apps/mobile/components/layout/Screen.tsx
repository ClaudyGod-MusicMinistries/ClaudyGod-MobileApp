import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useDeviceClass } from '../../util/deviceClassConfig';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, style, contentStyle }: ScreenProps) {
  const device = useDeviceClass();

  return (
    <View style={[{ width: '100%', paddingHorizontal: device.contentGutter }, style]}>
      <View
        style={[
          {
            width: '100%',
            maxWidth: device.maxContentWidth,
            alignSelf: 'center',
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
