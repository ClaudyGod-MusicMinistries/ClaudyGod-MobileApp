import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface SupportCardProps {
  onPress: () => void;
}

export function SupportMinistryCard({ onPress }: SupportCardProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View
      style={{
        minHeight: 104,
        borderRadius: 14,
        padding: 15,
        overflow: 'hidden',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -22,
          top: -18,
          width: 104,
          height: 104,
          borderRadius: 52,
          backgroundColor: 'rgba(255,255,255,0.10)',
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.18)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.24)',
          }}
        >
          <MaterialIcons name="volunteer-activism" size={20} color="#FFFFFF" />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.76)', textTransform: 'uppercase', letterSpacing: 0.72 }}>
            Support
          </CustomText>
          <CustomText variant="title" style={{ color: '#FFFFFF', marginTop: 3 }} numberOfLines={1}>
            Partner with the ministry
          </CustomText>
          <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.78)', marginTop: 5, lineHeight: 17 }} numberOfLines={2}>
            Help keep worship, messages, and live moments available to more people.
          </CustomText>
        </View>

        <TVTouchable
          onPress={onPress}
          showFocusBorder={false}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'center',
            gap: compact ? 0 : 6,
            width: compact ? 40 : undefined,
            minHeight: 38,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.34)',
            backgroundColor: 'rgba(255,255,255,0.16)',
            paddingHorizontal: compact ? 0 : 12,
            justifyContent: 'center',
            flexShrink: 0,
          }}
          accessibilityLabel="Give support"
        >
          {!compact ? (
            <CustomText variant="label" style={{ color: '#FFFFFF' }} numberOfLines={1}>
              Give support
            </CustomText>
          ) : null}
          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
        </TVTouchable>
      </View>
    </View>
  );
}
