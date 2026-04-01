/**
 * Beautiful Modern Section Header
 * Displays section titles with optional action button
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';

interface ModernSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const COLORS = {
  accent: '#A78BFA',
  textPrimary: '#F5F3FF',
  textSecondary: 'rgba(184,180,212,0.70)',
};

export function ModernSectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: ModernSectionHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <CustomText
          style={{
            color: COLORS.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          {title}
        </CustomText>
        {subtitle && (
          <CustomText
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
            }}
          >
            {subtitle}
          </CustomText>
        )}
      </View>

      {actionLabel && onActionPress && (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <CustomText
            style={{
              color: COLORS.accent,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {actionLabel}
          </CustomText>
          <MaterialIcons name="arrow-forward" size={14} color={COLORS.accent} />
        </Pressable>
      )}
    </View>
  );
}
