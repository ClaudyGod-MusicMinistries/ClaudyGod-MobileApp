import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CustomText } from '../../components/CustomText';
import { AuthFeedbackBanner } from '../../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../../components/auth/AuthScreenFrame';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { getEmailValidationMessage, isLikelyValidEmail, normalizeEmail } from './authValidation';
import { requestMobilePasswordReset } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { APP_ROUTES } from '../../util/appRoutes';
import { useAppTheme } from '../../util/colorScheme';

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
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
        title: 'Recovery code sent',
        message: 'Check your inbox for the password recovery code.',
        tone: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send recovery code.';
      setErrorMessage(message);
      showToast({ title: 'Recovery request failed', message, tone: 'error' });
    }
    setSubmitting(false);
  };

  const openResetScreen = () => {
    const currentEmail = email.trim().toLowerCase();
    if (currentEmail) {
      router.push({ pathname: APP_ROUTES.auth.resetPassword, params: { email: currentEmail } });
      return;
    }
    router.push(APP_ROUTES.auth.resetPassword);
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.auth.signIn}
      salutation="Recover your access"
      description="Use your account email and we will send a short recovery code."
      title="Reset password"
      subtitle="Enter your email to receive a recovery code."
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

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}
      {successMessage ? <AuthFeedbackBanner message={successMessage} tone="success" /> : null}

      <AppButton
        title="Send recovery code"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Sending code"
        loadingVariant="brand"
        onPress={() => void handleRequestReset()}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16 }}
      />

      <TVTouchable onPress={openResetScreen} style={{ alignSelf: 'center', marginTop: 12 }} showFocusBorder={false}>
        <CustomText variant="label" style={{ color: theme.colors.text_accent }}>
          Already have a code?
        </CustomText>
      </TVTouchable>

      <TVTouchable onPress={() => router.replace(APP_ROUTES.auth.signIn)} style={{ alignSelf: 'center', marginTop: 8 }} showFocusBorder={false}>
        <CustomText variant="label" style={{ color: 'rgba(220,213,240,0.84)' }}>
          Back to sign in
        </CustomText>
      </TVTouchable>
    </AuthScreenFrame>
  );
}
