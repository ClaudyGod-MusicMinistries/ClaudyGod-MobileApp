import React from 'react';
import { View, useWindowDimensions } from 'react-native';

import { CustomText } from '../CustomText';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { useFeedStyles } from './styles';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: AppIconName;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: AppIconName;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionIcon?: AppIconName;
};

export function EmptyState({
  title,
  message,
  icon = 'auto-awesome',
  actionLabel,
  onAction,
  actionIcon = 'arrow-forward',
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon = 'search',
}: EmptyStateProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const hasActions = Boolean((actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction));

  return (
    <FadeIn delay={60} style={styles.emptyOuter}>
      <View style={[styles.emptyContainer, isWide && styles.emptyContainerWide]}>
        <View style={styles.emptyIcon}>
          <AppIcon name={icon} size={22} color={theme.colors.primary} />
        </View>

        <View style={styles.emptyCopy}>
          <CustomText variant="title" style={styles.emptyTitle}>{title}</CustomText>
          <CustomText variant="body" style={styles.emptyMessage} numberOfLines={3}>{message}</CustomText>
        </View>

        {hasActions ? (
          <View style={[styles.emptyActions, !isWide && styles.emptyActionsStacked]}>
            {secondaryActionLabel && onSecondaryAction ? (
              <TVTouchable
                onPress={onSecondaryAction}
                showFocusBorder={false}
                style={[styles.emptyAction, styles.emptyActionSecondary]}
                accessibilityLabel={secondaryActionLabel}
              >
                <AppIcon name={secondaryActionIcon} size={16} color={theme.colors.text} />
                <CustomText variant="label" style={styles.emptyActionSecondaryText}>{secondaryActionLabel}</CustomText>
              </TVTouchable>
            ) : null}
            {actionLabel && onAction ? (
              <TVTouchable
                onPress={onAction}
                showFocusBorder={false}
                style={[styles.emptyAction, styles.emptyActionPrimary]}
                accessibilityLabel={actionLabel}
              >
                <CustomText variant="label" style={styles.emptyActionPrimaryText}>{actionLabel}</CustomText>
                <AppIcon name={actionIcon} size={16} color={theme.colors.onPrimary} />
              </TVTouchable>
            ) : null}
          </View>
        ) : null}
      </View>
    </FadeIn>
  );
}
