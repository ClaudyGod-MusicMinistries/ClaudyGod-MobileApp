// components/ui/SectionHeader.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
      }}
    >
      <CustomText variant="title" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      {actionLabel ? (
        <TouchableOpacity
          onPress={onAction}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: theme.radius.pill,
            backgroundColor: `${theme.colors.primary}14`,
          }}
        >
          <CustomText variant="label" style={{ color: theme.colors.primary }}>
            {actionLabel}
          </CustomText>
          <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
