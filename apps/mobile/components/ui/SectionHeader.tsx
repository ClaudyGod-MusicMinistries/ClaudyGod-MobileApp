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
  eyebrow?: string;
}

export function SectionHeader({ title, actionLabel, onAction, eyebrow }: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: eyebrow ? 2 : 0 }}>
        {eyebrow ? (
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textMuted ?? theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.9,
            }}
            numberOfLines={1}
          >
            {eyebrow}
          </CustomText>
        ) : null}
        <CustomText
          variant="heading"
          style={{
            color: theme.colors.text,
            letterSpacing: -0.25,
          }}
          numberOfLines={1}
        >
          {title}
        </CustomText>
      </View>

      {actionLabel ? (
        <TVTouchable
          onPress={onAction}
          style={{
            minHeight: 34,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            paddingHorizontal: 11,
            paddingVertical: 7,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)',
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
          activeOpacity={0.78}
          showFocusBorder={false}
        >
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.text,
              letterSpacing: 0.08,
            }}
            numberOfLines={1}
          >
            {actionLabel}
          </CustomText>
          <MaterialIcons name="chevron-right" size={16} color={theme.colors.textSecondary} />
        </TVTouchable>
      ) : null}
    </View>
  );
}
