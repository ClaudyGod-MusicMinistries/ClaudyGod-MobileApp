import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface SupportCardProps {
  onPress: () => void;
}

export function SupportMinistryCard({ onPress }: SupportCardProps) {
  const theme = useAppTheme();

  return (
    <LinearGradient
      colors={theme.colors.gradient.primary as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        minHeight: 104,
        borderRadius: 22,
        padding: 15,
        overflow: 'hidden',
        justifyContent: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
        elevation: 10,
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
            gap: 6,
            minHeight: 38,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.34)',
            backgroundColor: 'rgba(255,255,255,0.16)',
            paddingHorizontal: 12,
            flexShrink: 0,
          }}
        >
          <CustomText variant="label" style={{ color: '#FFFFFF' }} numberOfLines={1}>
            Give support
          </CustomText>
          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
        </TVTouchable>
      </View>
    </LinearGradient>
  );
}
