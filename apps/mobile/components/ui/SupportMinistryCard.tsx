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
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <LinearGradient
        colors={theme.colors.gradient.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: 118,
          borderRadius: 24,
          padding: 16,
          overflow: 'hidden',
          justifyContent: 'space-between',
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

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
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
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 13 }}>
          <CustomText variant="label" style={{ color: '#FFFFFF' }}>
            Give support
          </CustomText>
          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TVTouchable>
  );
}
