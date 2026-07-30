import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { type ToastItem, useToast } from '../../context/ToastContext';
import { makeStyles } from '../../styles/makeStyles';
import { useAppTheme } from '../../util/colorScheme';

// ─── Static styles (no theme) ─────────────────────────────────────────────────

const ss = StyleSheet.create({
  toastCard: {
    width: '100%', maxWidth: 420, alignSelf: 'center',
    borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  iconOffset: { marginTop: 1 },
  textCol:    { flex: 1 },
  dismissBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  viewport: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    zIndex: 100, justifyContent: 'flex-start',
    paddingHorizontal: 16, gap: 10,
  },
});

// ─── Theme styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  toastTitle: { color: theme.colors.text },
  toastCard: { borderRadius: theme.radius.xl, backgroundColor: theme.colors.elevated, ...theme.shadows.xl },
  toastMsg: { color: theme.colors.textSecondary, marginTop: 4 },
  dismissBtn: { backgroundColor: theme.colors.subtleFillMed },
}));

// ─── ToastCard ────────────────────────────────────────────────────────────────

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (_id: string) => void;
}) {
  const styles   = useStyles();
  const theme = useAppTheme();
  const translateY = useRef(new Animated.Value(14)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [opacity, translateY]);

  const palette =
    toast.tone === 'success'
      ? { accent: theme.colors.success, border: theme.colors.successBorder, icon: 'check-circle' as const }
      : toast.tone === 'error'
        ? { accent: theme.colors.danger, border: theme.colors.dangerBorder, icon: 'error-outline' as const }
        : toast.tone === 'warning'
          ? { accent: theme.colors.warning, border: theme.colors.warningBorder, icon: 'priority-high' as const }
          : { accent: theme.colors.info, border: theme.colors.infoBorder, icon: 'info-outline' as const };

  return (
    <Animated.View
      style={[
        ss.toastCard, styles.toastCard,
        { opacity, transform: [{ translateY }], borderColor: palette.border },
      ]}
    >
      <MaterialIcons name={palette.icon} size={18} color={palette.accent} style={ss.iconOffset} />

      <View style={ss.textCol}>
        <CustomText variant="label" style={styles.toastTitle}>{toast.title}</CustomText>
        {toast.message ? (
          <CustomText variant="caption" style={styles.toastMsg}>{toast.message}</CustomText>
        ) : null}
      </View>

      <TVTouchable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => onDismiss(toast.id)} showFocusBorder={false} style={[ss.dismissBtn, styles.dismissBtn]}>
        <MaterialIcons name="close" size={16} color={theme.colors.textSecondary} />
      </TVTouchable>
    </Animated.View>
  );
}

// ─── ToastViewport ────────────────────────────────────────────────────────────

export function ToastViewport() {
  const insets = useSafeAreaInsets();
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        ss.viewport,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      pointerEvents="box-none"
    >
      {toasts.slice(-1).map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
}
