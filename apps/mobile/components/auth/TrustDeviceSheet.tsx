/**
 * Bottom sheet shown once after a successful sign-in on a new device.
 * If user opts in, a long-lived trusted-device token is stored in SecureStore.
 * On future app opens, we gate it behind a biometric prompt — the server just
 * validates the token, the biometric check is entirely on-device.
 */
import React, { useState, useEffect } from 'react';
import { View, Modal, Animated, StyleSheet, Dimensions , Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import {
  getBiometricType,
  storeTrustedDeviceToken,
  isTrustedDeviceSupported,
} from '../../lib/trustedDevice';
import { registerTrustedDeviceToken } from '../../services/authService';

const { height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  accessToken: string;
  displayName: string;
  onDismiss: () => void;
}

export function TrustDeviceSheet({ visible, accessToken, displayName, onDismiss }: Props) {
  const theme = useAppTheme();
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');
  const [saving, setSaving] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 260,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible, slideAnim]);

  const biometricLabel = biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Touch ID / Fingerprint' : 'Biometrics';
  const biometricIcon = biometricType === 'face' ? 'face' : 'fingerprint';

  const handleTrust = async () => {
    setSaving(true);
    try {
      const fingerprint = `${Platform.OS}:${String(Platform.Version ?? 'unknown')}:${Date.now()}`;
      const label = `${Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'Device'} — ${new Date().toLocaleDateString()}`;

      const { token, expiresAt } = await registerTrustedDeviceToken({
        accessToken,
        deviceFingerprint: fingerprint,
        deviceLabel: label,
        platform: Platform.OS,
      });

      await storeTrustedDeviceToken(token, label, expiresAt);
      onDismiss();
    } catch {
      // If registration fails, just dismiss silently — it's non-critical
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  if (!isTrustedDeviceSupported() || biometricType === 'none') return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TVTouchable
        onPress={onDismiss}
        showFocusBorder={false}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      </TVTouchable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }], backgroundColor: theme.colors.elevated, borderTopColor: theme.colors.primaryBorder },
        ]}
      >
        <View style={styles.handle} />

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primaryBorder }]}>
          <MaterialIcons name={biometricIcon} size={36} color={theme.colors.primary} />
        </View>

        <CustomText variant="heading" style={[styles.title, { color: theme.colors.text }]}>
          Trust this device?
        </CustomText>
        <CustomText style={[styles.body, { color: theme.colors.textMuted }]}>
          Hi {displayName}, enable {biometricLabel} to sign in instantly next time — no password needed.
        </CustomText>

        <View style={styles.actions}>
          <AppButton
            title={`Enable ${biometricLabel}`}
            size="lg"
            fullWidth
            loading={saving}
            loadingLabel="Setting up…"
            leftIcon={<MaterialIcons name={biometricIcon} size={18} color={theme.colors.onPrimary} />}
            onPress={() => void handleTrust()}
          />
          <TVTouchable onPress={onDismiss} showFocusBorder={false} style={styles.skipBtn}>
            <CustomText style={[styles.skipLabel, { color: theme.colors.textMuted }]}>Not now</CustomText>
          </TVTouchable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#120E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginBottom: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#F7F2FF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    color: 'rgba(247,242,255,0.50)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipLabel: {
    color: 'rgba(214,190,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
});
