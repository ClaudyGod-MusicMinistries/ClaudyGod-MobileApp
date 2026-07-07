import React from 'react';
import { View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { useFeedStyles } from './styles';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, icon = 'auto-awesome', actionLabel, onAction }: EmptyStateProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  return (
    <FadeIn delay={60}>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
        </View>
        <CustomText variant="title" style={styles.emptyTitle}>{title}</CustomText>
        <CustomText variant="body" style={styles.emptyMessage} numberOfLines={3}>{message}</CustomText>
        {actionLabel && onAction ? (
          <AppButton title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 20 }} />
        ) : null}
      </View>
    </FadeIn>
  );
}
