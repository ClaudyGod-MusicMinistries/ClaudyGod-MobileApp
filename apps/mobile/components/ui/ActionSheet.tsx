import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { BottomSheet } from './BottomSheet';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

type ActionTone = 'default' | 'destructive' | 'accent';

export interface ActionSheetAction {
  key: string;
  label: string;
  detail?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  tone?: ActionTone;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  actions: ActionSheetAction[];
  onClose: () => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  actionsList: {
    borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: theme.spacing.md,
  },
  actionRowBase: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    minHeight: 56, backgroundColor: 'transparent',
  },
  actionDivider:   { borderTopColor: theme.colors.border },
  actionFill:      { flex: 1 },
  actionDetail:    { color: theme.colors.textSecondary, marginTop: 3 },
  cancelBtn: {
    minHeight: 48, borderRadius: theme.radius.lg,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  cancelText:  { color: theme.colors.textSecondary },
  iconBox: {
    width: 36, height: 36, borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function ActionSheet({
  visible,
  title,
  description,
  actions,
  onClose,
}: ActionSheetProps) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} description={description}>
      <View style={styles.actionsList}>
        {actions.map((action, index) => {
          const toneColor =
            action.tone === 'destructive' ? '#F2A7B6' :
            action.tone === 'accent'      ? theme.colors.primary :
                                           theme.colors.text;

          const iconBg =
            action.tone === 'destructive' ? 'rgba(242, 167, 182, 0.12)' :
            action.tone === 'accent'      ? 'rgba(139, 92, 246, 0.14)' :
                                           theme.colors.surfaceAlt;

          return (
            <TVTouchable
              key={action.key}
              onPress={() => { onClose(); action.onPress(); }}
              style={[
                styles.actionRowBase,
                styles.actionDivider,
                { borderTopWidth: index === 0 ? 0 : 1 },
              ]}
              showFocusBorder={false}
            >
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <MaterialIcons name={action.icon ?? 'arrow-forward'} size={18} color={toneColor} />
              </View>

              <View style={styles.actionFill}>
                <CustomText variant="title" style={{ color: toneColor }}>{action.label}</CustomText>
                {action.detail ? (
                  <CustomText variant="caption" style={styles.actionDetail}>{action.detail}</CustomText>
                ) : null}
              </View>

              <MaterialIcons name="chevron-right" size={18} color={theme.colors.textSecondary} />
            </TVTouchable>
          );
        })}
      </View>

      <TVTouchable onPress={onClose} style={styles.cancelBtn} showFocusBorder={false}>
        <MaterialIcons name="close" size={15} color={theme.colors.textSecondary} />
        <CustomText variant="label" style={styles.cancelText}>Cancel</CustomText>
      </TVTouchable>
    </BottomSheet>
  );
}
