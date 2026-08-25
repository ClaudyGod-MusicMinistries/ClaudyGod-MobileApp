import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { AppButton } from './AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface ConfirmModalProps {
  visible: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  /** Use the ClaudyGod mark for app-level feedback instead of a generic glyph. */
  brandMark?: boolean;
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
  backdrop:    { backgroundColor: theme.colors.scrim },
  centerWrap:  { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  animContent: { width: '100%', maxWidth: 390, alignSelf: 'center' },
  card: {
    borderRadius: theme.radius.xxl, borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.elevated,
    paddingHorizontal: 24, paddingTop: 26, paddingBottom: 22, gap: 20,
    ...theme.shadows.xl,
  },
  iconCenter:  { alignItems: 'center' },
  iconRingBase: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  brandLogoFrame: {
    width: 76, height: 76, borderRadius: 24, padding: 4,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    shadowColor: theme.colors.primary, shadowOpacity: 0.28,
    shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 7,
  },
  brandLogo: { width: '100%', height: '100%', borderRadius: 20 },
  brandLabel: {
    color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 2.2,
    fontSize: 10, fontWeight: '800', marginBottom: 2,
  },
  textContent: { gap: 8, alignItems: 'center' },
  titleText:   { color: theme.colors.text, textAlign: 'center', letterSpacing: -0.35 },
  bodyText:    { color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 21, maxWidth: 310 },
  btnsGap:     { gap: 12, paddingTop: 2 },
  dangerBtn:   { backgroundColor: theme.colors.danger },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmModal({
  visible,
  icon,
  iconColor,
  brandMark = false,
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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(theme.motion.modalInitialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(theme.motion.modalInitialScale);
      opacity.setValue(0);
      return;
    }
    if (reduceMotion) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: theme.motion.modalEnterDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.motion.modalEnterDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [opacity, reduceMotion, scale, theme.motion.modalEnterDuration, theme.motion.modalInitialScale, visible]);

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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.centerWrap, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.animContent, { transform: [{ scale }], opacity }]}
            accessibilityViewIsModal
          >
            <ScrollView
              style={{ maxHeight: Math.max(280, height - insets.top - insets.bottom - 40) }}
              contentContainerStyle={styles.card}
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.iconCenter}>
                {brandMark ? (
                  <View style={styles.brandLogoFrame}>
                    <Image source={BRAND_LOGO_ASSET} style={styles.brandLogo} resizeMode="cover" accessibilityLabel="ClaudyGod" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.iconRingBase,
                      {
                        backgroundColor: `${resolvedIconColor}1A`,
                        borderColor: `${resolvedIconColor}44`,
                      },
                    ]}
                  >
                    <MaterialIcons name={icon} size={30} color={resolvedIconColor} />
                  </View>
                )}
              </View>

              <View style={styles.textContent}>
                {brandMark ? <CustomText style={styles.brandLabel}>ClaudyGod</CustomText> : null}
                <CustomText variant="heading" style={styles.titleText}>{title}</CustomText>
                {body ? (
                  <CustomText variant="body" style={styles.bodyText}>{body}</CustomText>
                ) : null}
              </View>

              <View style={styles.btnsGap}>
                <AppButton
                  title={primaryLabel}
                  variant={isDanger ? 'primary' : 'gradient'}
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
                    variant="secondary"
                    size="lg"
                    fullWidth
                    disabled={loading}
                    onPress={handleSecondary}
                  />
                ) : null}
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
