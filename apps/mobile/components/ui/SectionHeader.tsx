// components/ui/SectionHeader.tsx
import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

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
        marginBottom: theme.spacing.sm,
      }}
    >
      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      {actionLabel ? (
        <TVTouchable
          onPress={onAction}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 0,
            paddingVertical: 0,
          }}
          showFocusBorder={false}
        >
          <CustomText
            variant="label"
            style={{ color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.18 }}
          >
            {actionLabel}
          </CustomText>
          <MaterialIcons name="chevron-right" size={16} color={theme.colors.text.secondary} />
        </TVTouchable>
      ) : null}
    </View>
  );
}
