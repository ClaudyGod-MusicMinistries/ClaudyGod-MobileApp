import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { requestMobilePasswordReset } from '../services/authService';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();

  const [email, setEmail] = useState(() => getParam(params.email).trim().toLowerCase());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canSubmit = useMemo(() => Boolean(email.trim()), [email]);

  const handleRequestReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestMobilePasswordReset({ email: normalizedEmail });
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath="/sign-in"
      salutation="Recover your account"
      description="Receive a secure password reset link so you can return to your library without losing your saved ministry experience."
      title="Reset your password"
      subtitle="Enter your account email and we will send you a secure recovery link."
    >
      <View style={{ gap: 12 }}>
        <AuthTextField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="name@example.com"
          returnKeyType="send"
          onSubmitEditing={() => void handleRequestReset()}
        />
      </View>

      <CustomText variant="caption" style={{ color: 'rgba(188,178,214,0.9)', marginTop: 10 }}>
        We send a recovery link, not a plain-text password. Open the link on the same device when possible.
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
        title="Send Recovery Link"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Sending recovery email"
        loadingVariant="brand"
        onPress={() => void handleRequestReset()}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16 }}
      />

      <TVTouchable
        onPress={() => {
          const normalizedEmail = email.trim().toLowerCase();
          if (normalizedEmail) {
            router.push({
              pathname: '/reset-password',
              params: { email: normalizedEmail },
            });
            return;
          }
          router.push('/reset-password');
        }}
        style={{ alignSelf: 'center', marginTop: 12 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
          Already opened the reset email?
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
