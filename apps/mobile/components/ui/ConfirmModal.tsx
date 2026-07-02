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
import { AppButton } from './AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface ConfirmModalProps {
  visible: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  title: string;
  body?: string;
  primaryLabel: string;
  primaryTone?: 'danger' | 'primary';
  /** Pass undefined to hide the secondary button entirely */
  secondaryLabel?: string;
  loading?: boolean;
  onPrimary: () => void;
  onSecondary?: () => void;
  onDismiss: () => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  backdrop:    { backgroundColor: 'rgba(2,1,6,0.70)' },
  centerWrap:  { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  animContent: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  card: {
    borderRadius: 16, borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.elevated,
    padding: 24, gap: 20,
    shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  iconCenter:  { alignItems: 'center' },
  iconRingBase: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  textContent: { gap: 8, alignItems: 'center' },
  titleText:   { color: theme.colors.text, textAlign: 'center' },
  bodyText:    { color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  btnsGap:     { gap: 10 },
  dangerBtn:   { backgroundColor: theme.colors.danger },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmModal({
  visible,
  icon,
  iconColor,
  title,
  body,
  primaryLabel,
  primaryTone = 'primary',
  secondaryLabel,
  loading = false,
  onPrimary,
  onSecondary,
  onDismiss,
}: ConfirmModalProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.88);
      opacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: USE_NATIVE_DRIVER,
        damping: 18,
        stiffness: 240,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  const isDanger = primaryTone === 'danger';
  const accentColor = isDanger ? theme.colors.danger : theme.colors.primary;
  const resolvedIconColor = iconColor ?? accentColor;

  const handlePrimary = () => { if (!loading) onPrimary(); };
  const handleSecondary = () => { if (!loading) (onSecondary ?? onDismiss)(); };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => { if (!loading) onDismiss(); }}
    >
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={() => { if (!loading) onDismiss(); }}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />

        <View style={styles.centerWrap} pointerEvents="box-none">
          <Animated.View
            style={[styles.animContent, { transform: [{ scale }], opacity }]}
          >
            <View style={styles.card}>
              <View style={styles.iconCenter}>
                <View
                  style={[
                    styles.iconRingBase,
                    {
                      backgroundColor: `${resolvedIconColor}1A`,
                      borderColor: `${resolvedIconColor}44`,
                    },
                  ]}
                >
                  <MaterialIcons name={icon} size={32} color={resolvedIconColor} />
                </View>
              </View>

              <View style={styles.textContent}>
                <CustomText variant="heading" style={styles.titleText}>{title}</CustomText>
                {body ? (
                  <CustomText variant="body" style={styles.bodyText}>{body}</CustomText>
                ) : null}
              </View>

              <View style={styles.btnsGap}>
                <AppButton
                  title={primaryLabel}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                  onPress={handlePrimary}
                  style={isDanger ? styles.dangerBtn : undefined}
                  textColor="#FFFFFF"
                />
                {secondaryLabel ? (
                  <AppButton
                    title={secondaryLabel}
                    variant="ghost"
                    size="lg"
                    fullWidth
                    disabled={loading}
                    onPress={handleSecondary}
                  />
                ) : null}
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
