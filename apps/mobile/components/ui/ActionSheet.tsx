import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
  overlay:         { flex: 1, justifyContent: 'flex-end', padding: theme.spacing.lg },
  sheet: {
    borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md, gap: theme.spacing.md,
  },
  headerGroup:     { gap: 6 },
  dragHandle: {
    alignSelf: 'center', width: 42, height: 4, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: 6,
  },
  sheetTitle:      { color: theme.colors.text },
  sheetDesc:       { color: theme.colors.textSecondary },
  actionsList: {
    borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: 'rgba(255,255,255,0.02)',
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
  backdrop:    { backgroundColor: 'rgba(5, 6, 14, 0.72)' },
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
  const styles    = useStyles();
  const theme     = useAppTheme();
  const translateY = useRef(new Animated.Value(28)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      translateY.setValue(28);
      opacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity,    { toValue: 1, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />

        <View style={styles.overlay}>
          <Animated.View style={{ transform: [{ translateY }], opacity }}>
            <View style={styles.sheet}>
              <View style={styles.headerGroup}>
                <View style={styles.dragHandle} />
                <CustomText variant="heading" style={styles.sheetTitle}>{title}</CustomText>
                {description ? (
                  <CustomText variant="body" style={styles.sheetDesc}>{description}</CustomText>
                ) : null}
              </View>

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
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
