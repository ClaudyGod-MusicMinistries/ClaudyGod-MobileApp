import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { getEmailValidationMessage, isLikelyValidEmail, normalizeEmail } from '../lib/authValidation';
import { requestMobilePasswordReset } from '../services/authService';
import { useToast } from '../context/ToastContext';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ email?: string | string[] }>();

  const [email, setEmail] = useState(() => getParam(params.email).trim().toLowerCase());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const normalizedEmail = normalizeEmail(email);
  const emailIsValid = !normalizedEmail || isLikelyValidEmail(normalizedEmail);
  const emailHint = getEmailValidationMessage(email);

  const canSubmit = useMemo(() => Boolean(normalizedEmail && emailIsValid), [emailIsValid, normalizedEmail]);

  const handleRequestReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!normalizedEmail) {
      const message = 'Enter your email address.';
      setErrorMessage(message);
      showToast({ title: 'Email required', message, tone: 'warning' });
      return;
    }

    if (!emailIsValid) {
      setErrorMessage(emailHint);
      showToast({ title: 'Check your email address', message: emailHint, tone: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestMobilePasswordReset({ email: normalizedEmail });
      setSuccessMessage(response.message);
      showToast({
        title: 'Recovery email sent',
        message: 'If the account exists, the 6-digit reset code is on its way.',
        tone: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset email';
      setErrorMessage(message);
      showToast({ title: 'Recovery request failed', message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath="/sign-in"
      salutation="Recover your account"
      description="Receive a 6-digit recovery code at your registered email so you can securely choose a new password without losing your saved ministry experience."
      title="Reset your password"
      subtitle="Enter your account email and we will send a short-lived recovery code."
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
          hint={normalizedEmail ? emailHint : ''}
          hintTone={normalizedEmail ? (emailIsValid ? 'success' : 'error') : 'default'}
          returnKeyType="send"
          onSubmitEditing={() => void handleRequestReset()}
        />
      </View>

      <CustomText variant="caption" style={{ color: 'rgba(188,178,214,0.9)', marginTop: 10 }}>
        The recovery code expires quickly and is sent only to the email used on your account.
      </CustomText>

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}

      {successMessage ? <AuthFeedbackBanner message={successMessage} tone="success" /> : null}

      <AppButton
        title="Send Recovery Code"
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
          Already have the recovery code?
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
