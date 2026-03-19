import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { resetMobilePassword } from '../services/authService';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    token?: string | string[];
    token_hash?: string | string[];
    email?: string | string[];
  }>();

  const queryToken = useMemo(
    () => getParam(params.token).trim() || getParam(params.token_hash).trim(),
    [params.token, params.token_hash],
  );

  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canSubmit = useMemo(
    () => Boolean(token.trim() && newPassword.trim() && confirmPassword.trim()),
    [confirmPassword, newPassword, token],
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

    if (!token.trim()) {
      setErrorMessage('Open the reset link from your email or paste the reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetMobilePassword({
        token: token.trim(),
        newPassword,
      });
      setSuccessMessage(response.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath="/sign-in"
      salutation="Set a new password"
      description="Use the secure recovery link from your email, then choose a new password to protect your ClaudyGod account."
      title="Create a fresh password"
      subtitle="Open the email link first. If the mail client exposed the token in the URL, you can paste it below and continue."
    >
      <View style={{ gap: 12 }}>
        <AuthTextField
          label="Reset token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          placeholder="Paste reset token if needed"
        />
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
        />
      </View>

      <CustomText variant="caption" style={{ color: 'rgba(188,178,214,0.9)', marginTop: 10 }}>
        Use at least 8 characters with uppercase, lowercase, and a number for a stronger password.
      </CustomText>

      {errorMessage ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,120,120,0.22)',
            backgroundColor: 'rgba(255,80,80,0.08)',
            paddingHorizontal: 13,
            paddingVertical: 11,
          }}
        >
          <CustomText variant="caption" style={{ color: '#FFD6D6' }}>
            {errorMessage}
          </CustomText>
        </View>
      ) : null}

      {successMessage ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(122,230,166,0.30)',
            backgroundColor: 'rgba(56,170,104,0.14)',
            paddingHorizontal: 13,
            paddingVertical: 11,
          }}
        >
          <CustomText variant="caption" style={{ color: '#D4FFE4' }}>
            {successMessage}
          </CustomText>
        </View>
      ) : null}

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
              pathname: '/forgot-password',
              params: { email: normalizedEmail },
            });
            return;
          }
          router.push('/forgot-password');
        }}
        style={{ alignSelf: 'center', marginTop: 12 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
          Need a new reset email?
        </CustomText>
      </TVTouchable>

      <TVTouchable
        onPress={() => router.replace('/sign-in')}
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
