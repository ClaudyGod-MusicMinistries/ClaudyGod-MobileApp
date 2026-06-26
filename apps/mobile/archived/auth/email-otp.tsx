/**
 * Passwordless email sign-in via a 6-digit one-time code.
 * Phase 1: user enters email → POST /v1/auth/otp/request
 * Phase 2: user enters 6-digit code → POST /v1/auth/otp/verify → session issued
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { isLikelyValidEmail, normalizeEmail } from '../lib/authValidation';
import { requestEmailOtp, verifyEmailOtp } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { APP_ROUTES } from '../util/appRoutes';
import { useAppTheme } from '../util/colorScheme';

type Phase = 'email' | 'code';

const CODE_LENGTH = 6;

export default function EmailOtpScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const normalizedEmail = normalizeEmail(email);

  const startResendTimer = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendCode = async () => {
    setError('');
    if (!normalizedEmail || !isLikelyValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestEmailOtp(normalizedEmail);
      setPhase('code');
      startResendTimer();
      showToast({ title: 'Code sent', message: `Check your inbox at ${normalizedEmail}`, tone: 'success' });
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send code right now.';
      setError(msg);
      showToast({ title: 'Error', message: msg, tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.join('').length === CODE_LENGTH) {
      void handleVerify(next.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = (code ?? digits.join('')).trim();
    if (finalCode.length !== CODE_LENGTH) {
      setError('Enter the complete 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmailOtp(normalizedEmail, finalCode);
      router.replace(APP_ROUTES.tabs.home);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid code. Try again.';
      setError(msg);
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setDigits(Array(CODE_LENGTH).fill(''));
    setLoading(true);
    try {
      await requestEmailOtp(normalizedEmail);
      startResendTimer();
      showToast({ title: 'New code sent', message: 'Check your inbox.', tone: 'success' });
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not resend right now.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.auth.signIn}
      salutation="No password needed"
      description="Enter your email and we'll send a 6-digit code to sign you in instantly."
      title={phase === 'email' ? 'Sign in with email' : 'Enter your code'}
      subtitle={
        phase === 'email'
          ? 'We\'ll send a 6-digit sign-in code to your inbox — no password needed.'
          : `We sent a 6-digit code to ${normalizedEmail}. Enter it below to sign in.`
      }
    >
      {phase === 'email' ? (
        <>
          <AuthTextField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="name@example.com"
            leading={<MaterialIcons name="mail-outline" size={18} color={theme.colors.textMuted} />}
          />

          {error ? <AuthFeedbackBanner message={error} tone="error" /> : null}

          <AppButton
            title="Send sign-in code"
            size="lg"
            fullWidth
            loading={loading}
            loadingLabel="Sending…"
            leftIcon={<MaterialIcons name="send" size={16} color="#FFFFFF" />}
            onPress={() => void handleSendCode()}
            style={{ marginTop: 8 }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              Prefer a password?
            </CustomText>
            <TVTouchable
              onPress={() => router.back()}
              showFocusBorder={false}
              style={{ marginLeft: 6 }}
            >
              <CustomText style={{ color: theme.colors.text_accent, fontSize: 13, fontWeight: '700' }}>
                Sign in with password
              </CustomText>
            </TVTouchable>
          </View>
        </>
      ) : (
        <>
          {/* 6-digit code boxes */}
          <View style={styles.codeRow}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                value={digits[i]}
                onChangeText={(v) => handleDigitChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                style={[
                  styles.codeBox,
                  { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg },
                  digits[i] ? styles.codeBoxFilled : null,
                ]}
                placeholderTextColor={theme.colors.textMuted}
                placeholder="·"
              />
            ))}
          </View>

          {error ? <AuthFeedbackBanner message={error} tone="error" /> : null}

          <AppButton
            title="Verify code"
            size="lg"
            fullWidth
            loading={loading}
            loadingLabel="Verifying…"
            leftIcon={<MaterialIcons name="verified" size={16} color="#FFFFFF" />}
            onPress={() => void handleVerify()}
            disabled={digits.join('').length < CODE_LENGTH || loading}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 4 }}>
            <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              {"Didn't get it?"}
            </CustomText>
            <TVTouchable
              onPress={() => void handleResend()}
              disabled={resendCooldown > 0 || loading}
              showFocusBorder={false}
            >
              <CustomText style={{
                fontSize: 13,
                fontWeight: '700',
                color: resendCooldown > 0 ? theme.colors.textMuted : theme.colors.text_accent,
              }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </CustomText>
            </TVTouchable>
          </View>

          <TVTouchable
            onPress={() => { setPhase('email'); setError(''); setDigits(Array(CODE_LENGTH).fill('')); }}
            showFocusBorder={false}
            style={{ alignSelf: 'center', marginTop: 8 }}
          >
            <CustomText style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              Change email address
            </CustomText>
          </TVTouchable>
        </>
      )}
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  codeBoxFilled: {
    borderColor: 'rgba(124,58,237,0.55)',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
});
