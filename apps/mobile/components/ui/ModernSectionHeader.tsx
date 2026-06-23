import React from 'react';
import { View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface ModernSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function ModernSectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: ModernSectionHeaderProps) {
  const theme = useAppTheme();
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
          variant="title"
          style={{
            color: theme.colors.text,
            fontSize: 14.5,
            fontWeight: '600',
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          {title}
        </CustomText>
        {subtitle && (
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textSecondary,
              fontSize: 10.5,
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
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <CustomText
            variant="meta"
            style={{
              color: theme.colors.secondary,
              fontSize: 10.6,
              fontWeight: '500',
            }}
          >
            {actionLabel}
          </CustomText>
          <MaterialIcons name="chevron-right" size={15} color={theme.colors.secondary} />
        </Pressable>
      )}
    </View>
  );
}
