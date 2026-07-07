import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { AuthFeedbackBanner } from '../../components/auth/AuthFeedbackBanner';
import { AuthOtpInput } from '../../components/auth/AuthOtpInput';
import { AuthScreenFrame } from '../../components/auth/AuthScreenFrame';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { PasswordStrengthPanel } from '../../components/auth/PasswordStrengthPanel';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import {
  getEmailValidationMessage,
  getPasswordConfirmationMessage,
  isLikelyValidEmail,
  isPasswordCompliant,
  normalizeEmail,
} from './authValidation';
import { resetMobilePassword } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { APP_ROUTES } from '../../util/appRoutes';
import { useAppTheme } from '../../util/colorScheme';

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ token?: string | string[]; token_hash?: string | string[]; email?: string | string[]; notice?: string | string[] }>();

  const queryToken = useMemo(() => getParam(params.token).trim() || getParam(params.token_hash).trim(), [params.token, params.token_hash]);
  const usesLinkToken = queryToken.length > 6;

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
  const canSubmit = Boolean((usesLinkToken || (normalizedEmail && emailIsValid)) && token.trim() && newPassword.trim() && confirmPassword.trim() && passwordIsCompliant && passwordsMatch);

  const visibilityToggle = (
    <TVTouchable onPress={() => setHidePassword((prev) => !prev)} showFocusBorder={false}>
      <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={20} color={theme.colors.textSecondary} />
    </TVTouchable>
  );

  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const resolvedToken = token.trim();
    if (!resolvedToken) {
      const message = 'Enter the recovery code from your email.';
      setErrorMessage(message);
      showToast({ title: 'Recovery code required', message, tone: 'warning' });
      return;
    }

    if (!usesLinkToken && !normalizedEmail) {
      const message = 'Enter the email address used to request recovery.';
      setErrorMessage(message);
      showToast({ title: 'Email required', message, tone: 'warning' });
      return;
    }

    if (!usesLinkToken && !emailIsValid) {
      setErrorMessage(emailHint);
      showToast({ title: 'Check your email address', message: emailHint, tone: 'warning' });
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
      showToast({ title: 'Password mismatch', message, tone: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetMobilePassword({ token: resolvedToken, email: normalizedEmail || undefined, newPassword });
      setSuccessMessage(response.message);
      setNewPassword('');
      setConfirmPassword('');
      showToast({ title: 'Password updated', message: 'You can now sign in with your new password.', tone: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password.';
      setErrorMessage(message);
      showToast({ title: 'Reset failed', message, tone: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.auth.signIn}
      salutation="Create a fresh password"
      description="Use the recovery code from your email and choose a secure password."
      title="Update password"
      subtitle="Enter your email, recovery code, and new password."
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
          hint={usesLinkToken ? 'Email is optional when using a secure recovery link.' : normalizedEmail ? emailHint : ''}
          hintTone={usesLinkToken ? 'default' : normalizedEmail ? (emailIsValid ? 'success' : 'error') : 'default'}
        />

        {usesLinkToken ? (
          <AuthFeedbackBanner message="Secure recovery link detected. Choose a new password below." tone="success" />
        ) : (
          <AuthOtpInput label="Recovery code" value={token} onChangeText={setToken} placeholder="Enter the recovery code" onSubmitEditing={() => void handleResetPassword()} />
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

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}
      {successMessage ? <AuthFeedbackBanner message={successMessage} tone="success" /> : null}

      <AppButton title="Update password" size="lg" fullWidth loading={submitting} loadingLabel="Updating password" loadingVariant="brand" onPress={() => void handleResetPassword()} disabled={!canSubmit || submitting} style={{ marginTop: 16 }} />

      <TVTouchable onPress={() => router.push(APP_ROUTES.auth.forgotPassword)} style={{ alignSelf: 'center', marginTop: 12 }} showFocusBorder={false}>
        <CustomText variant="label" style={{ color: theme.colors.text_accent }}>
          Need a new code?
        </CustomText>
      </TVTouchable>
    </AuthScreenFrame>
  );
}
