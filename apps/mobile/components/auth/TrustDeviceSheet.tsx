/**
 * Bottom sheet shown once after a successful sign-in on a new device.
 * If user opts in, a long-lived trusted-device token is stored in SecureStore.
 * On future app opens, we gate it behind a biometric prompt — the server just
 * validates the token, the biometric check is entirely on-device.
 */
import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { TVTouchable } from '../ui/TVTouchable';
import { BottomSheet } from '../ui/BottomSheet';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import {
  getBiometricType,
  storeTrustedDeviceToken,
  isTrustedDeviceSupported,
} from '../../lib/trustedDevice';
import { registerTrustedDeviceToken } from '../../services/authService';

interface Props {
  visible: boolean;
  accessToken: string;
  displayName: string;
  onDismiss: () => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  content: { alignItems: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryBorder,
  },
  title: {
    fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8,
    color: theme.colors.text,
  },
  body: {
    fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28,
    color: theme.colors.textMuted,
  },
  actions:   { width: '100%', gap: 10 },
  skipBtn:   { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  skipLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function TrustDeviceSheet({ visible, accessToken, displayName, onDismiss }: Props) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  const biometricLabel = biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Touch ID / Fingerprint' : 'Biometrics';
  const biometricIcon  = biometricType === 'face' ? 'face' : 'fingerprint';

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
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  if (!isTrustedDeviceSupported() || biometricType === 'none') return null;

  return (
    <BottomSheet visible={visible} onClose={onDismiss}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name={biometricIcon} size={36} color={theme.colors.primary} />
        </View>

        <CustomText variant="heading" style={styles.title}>
          Trust this device?
        </CustomText>
        <CustomText style={styles.body}>
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
            <CustomText style={styles.skipLabel}>Not now</CustomText>
          </TVTouchable>
        </View>
      </View>
    </BottomSheet>
  );
}
