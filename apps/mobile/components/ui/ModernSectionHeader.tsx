import React from 'react';
import { View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

interface ModernSectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  row: {
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  titleCol:    { flex: 1 },
  titleText: {
    color: theme.colors.text, fontSize: 14.5, fontWeight: '600',
  },
  titleWithSub: { marginBottom: 4 },
  subtitleText: { color: theme.colors.textSecondary, fontSize: 10.5 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  actionText: { color: theme.colors.secondary, fontSize: 10.6, fontWeight: '500' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function ModernSectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: ModernSectionHeaderProps) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titleCol}>
        <CustomText
          variant="title"
          style={[styles.titleText, subtitle ? styles.titleWithSub : null]}
        >
          {title}
        </CustomText>
        {subtitle ? (
          <CustomText variant="caption" style={styles.subtitleText}>
            {subtitle}
          </CustomText>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <CustomText variant="meta" style={styles.actionText}>{actionLabel}</CustomText>
          <MaterialIcons name="chevron-right" size={15} color={theme.colors.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
