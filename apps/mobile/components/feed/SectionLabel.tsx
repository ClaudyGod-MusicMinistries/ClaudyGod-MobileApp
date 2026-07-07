import React from 'react';
import { View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useFeedStyles } from './styles';

export function SectionLabel({ title, accent: _accent, subtitle, actionLabel, onAction }: {
  title: string;
  accent?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();

  return (
    <View>
      <View style={styles.sectionLabelRow}>
        <CustomText variant="heading" style={styles.sectionLabelTitle} numberOfLines={1}>{title}</CustomText>
        {actionLabel && onAction ? (
          <TVTouchable onPress={onAction} showFocusBorder={false} style={styles.sectionActionBtn}>
            <CustomText style={styles.sectionActionText}>{actionLabel}</CustomText>
            <MaterialIcons name="chevron-right" size={15} color={theme.colors.primary} />
          </TVTouchable>
        ) : null}
      </View>
      {subtitle ? (
        <CustomText variant="body" style={styles.sectionSubtitle} numberOfLines={1}>{subtitle}</CustomText>
      ) : null}
    </View>
  );
}
