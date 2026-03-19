import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthOtpInput } from '../components/auth/AuthOtpInput';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { PasswordStrengthPanel } from '../components/auth/PasswordStrengthPanel';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import {
  getEmailValidationMessage,
  getPasswordConfirmationMessage,
  isLikelyValidEmail,
  isPasswordCompliant,
  normalizeEmail,
} from '../lib/authValidation';
import { resetMobilePassword } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { APP_ROUTES } from '../util/appRoutes';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    token?: string | string[];
    token_hash?: string | string[];
    email?: string | string[];
    notice?: string | string[];
  }>();

  const queryToken = useMemo(
    () => getParam(params.token).trim() || getParam(params.token_hash).trim(),
    [params.token, params.token_hash],
  );
  const usesLegacyToken = queryToken.length > 6;

  const [email, setEmail] = useState(() => getParam(params.email).trim().toLowerCase());
  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(() => getParam(params.notice).trim());
  const normalizedEmail = normalizeEmail(email);
  const emailIsValid = !normalizedEmail || isLikelyValidEmail(normalizedEmail);
  const emailHint = getEmailValidationMessage(email);
  const passwordIsCompliant = isPasswordCompliant(newPassword);
  const passwordsMatch = Boolean(confirmPassword.trim()) && newPassword === confirmPassword;
  const confirmHint = getPasswordConfirmationMessage(newPassword, confirmPassword);

  const canSubmit = useMemo(
    () =>
      Boolean(
        (usesLegacyToken || (normalizedEmail && emailIsValid)) &&
          token.trim() &&
          newPassword.trim() &&
          confirmPassword.trim() &&
          passwordIsCompliant &&
          passwordsMatch,
      ),
    [confirmPassword, emailIsValid, newPassword, normalizedEmail, passwordIsCompliant, passwordsMatch, token, usesLegacyToken],
  );

  const visibilityToggle = (
    <TVTouchable onPress={() => setHidePassword((prev) => !prev)} showFocusBorder={false}>
      <MaterialIcons
        name={hidePassword ? 'visibility' : 'visibility-off'}
        size={20}
        color="rgba(226,218,247,0.9)"
      />
    </TVTouchable>
  );

  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedToken = token.trim();

    if (!normalizedEmail && normalizedToken.length <= 6) {
      const message = 'Enter the email address used to request the recovery code.';
      setErrorMessage(message);
      showToast({ title: 'Email required', message, tone: 'warning' });
      return;
    }

    if (normalizedToken.length <= 6 && !emailIsValid) {
      setErrorMessage(emailHint);
      showToast({ title: 'Check your email address', message: emailHint, tone: 'warning' });
      return;
    }

    if (!normalizedToken) {
      const message = 'Enter the 6-digit recovery code from your email or use the secure recovery link.';
      setErrorMessage(message);
      showToast({ title: 'Recovery code required', message, tone: 'warning' });
      return;
    }

    if (!passwordIsCompliant) {
      const message = 'Use at least 8 characters with uppercase, lowercase, and a number.';
      setErrorMessage(message);
      showToast({ title: 'Strengthen your password', message, tone: 'warning' });
      return;
    }

    if (!passwordsMatch) {
      const message = 'New password and confirmation do not match.';
      setErrorMessage(message);
      showToast({ title: 'Password confirmation mismatch', message, tone: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetMobilePassword({
        token: normalizedToken,
        email: normalizedEmail || undefined,
        newPassword,
      });
      setSuccessMessage(response.message);
      setNewPassword('');
      setConfirmPassword('');
      showToast({
        title: 'Password updated',
        message: 'Your password was changed successfully. You can sign in with it now.',
        tone: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password';
      setErrorMessage(message);
      showToast({ title: 'Reset failed', message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.auth.signIn}
      salutation="Set a new password"
      description="Use the 6-digit recovery code from your email, then choose a new password to protect your ClaudyGod account."
      title="Create a fresh password"
      subtitle="Enter your account email, the recovery code, and a new password. Older recovery links still work when opened on this device."
    >
      <View style={{ gap: 12 }}>
        <AuthTextField
          label="Account email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="name@example.com"
          hint={usesLegacyToken ? 'Optional for older recovery links, required for code-based recovery.' : normalizedEmail ? emailHint : ''}
          hintTone={usesLegacyToken ? 'default' : normalizedEmail ? (emailIsValid ? 'success' : 'error') : 'default'}
        />
        {usesLegacyToken ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(156,125,255,0.26)',
              backgroundColor: 'rgba(115,86,189,0.12)',
              paddingHorizontal: 13,
              paddingVertical: 11,
            }}
          >
            <CustomText variant="caption" style={{ color: '#E7DEFF' }}>
              Secure recovery link detected. Your reset token has already been captured, so you can
              choose a new password below.
            </CustomText>
          </View>
        ) : (
          <AuthOtpInput
            label="Recovery code"
            value={token}
            onChangeText={setToken}
            placeholder="Enter the 6-digit code from your email"
            onSubmitEditing={() => void handleResetPassword()}
          />
        )}
        <AuthTextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Create a secure password"
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          trailing={visibilityToggle}
          hint={newPassword.trim() ? 'Keep it unique from old passwords and easy for you to remember.' : ''}
        />
        {newPassword.trim() ? <PasswordStrengthPanel password={newPassword} /> : null}
        <AuthTextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void handleResetPassword()}
          hint={confirmHint}
          hintTone={confirmPassword.trim() ? (passwordsMatch ? 'success' : 'error') : 'default'}
        />
      </View>

      <CustomText variant="caption" style={{ color: 'rgba(188,178,214,0.9)', marginTop: 10 }}>
        Use at least 8 characters with uppercase, lowercase, and a number. Recovery codes expire quickly for security.
      </CustomText>

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}

      {successMessage ? <AuthFeedbackBanner message={successMessage} tone="success" /> : null}

      <AppButton
        title="Update Password"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Updating password"
        loadingVariant="brand"
        onPress={() => void handleResetPassword()}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16 }}
      />

      <TVTouchable
        onPress={() => {
          const normalizedEmail = getParam(params.email).trim().toLowerCase();
          if (normalizedEmail) {
            router.push({
              pathname: APP_ROUTES.auth.forgotPassword,
              params: { email: normalizedEmail },
            });
            return;
          }
          router.push(APP_ROUTES.auth.forgotPassword);
        }}
        style={{ alignSelf: 'center', marginTop: 12 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
          Need a new reset email?
        </CustomText>
      </TVTouchable>

      <TVTouchable
        onPress={() => router.replace(APP_ROUTES.auth.signIn)}
        style={{ alignSelf: 'center', marginTop: 8 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: 'rgba(220,213,240,0.84)' }}>
          Back to Sign In
        </CustomText>
      </TVTouchable>
    </AuthScreenFrame>
  );
}
