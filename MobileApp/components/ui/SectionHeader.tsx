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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <CustomText
        className="font-bold"
        style={{ color: theme.colors.text.primary, fontSize: theme.typography.title }}
      >
        {title}
      </CustomText>
      {actionLabel ? (
        <TouchableOpacity
          onPress={onAction}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <CustomText style={{ color: theme.colors.primary, fontSize: theme.typography.label }}>
            {actionLabel}
          </CustomText>
          <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

