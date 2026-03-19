import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useAuth } from '../context/AuthContext';
import { requestVerificationEmail, verifyMobileEmail } from '../services/authService';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{
    email?: string | string[];
    token?: string | string[];
    token_hash?: string | string[];
  }>();

  const queryToken = useMemo(
    () => getParam(params.token).trim() || getParam(params.token_hash).trim(),
    [params.token, params.token_hash],
  );

  const [email, setEmail] = useState(() => getParam(params.email).trim().toLowerCase());
  const [token, setToken] = useState(queryToken);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const autoVerifyTriggered = useRef(false);

  const canVerify = useMemo(() => Boolean(token.trim()), [token]);
  const canResend = useMemo(() => Boolean(email.trim()), [email]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('Email verified successfully. Redirecting...');
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 600);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  const handleVerify = async (tokenValue?: string) => {
    setErrorMessage('');
    setSuccessMessage('');

    const resolvedToken = (tokenValue ?? token).trim();
    if (!resolvedToken) {
      setErrorMessage('Open the verification link from your email or paste the verification token.');
      return;
    }

    setVerifying(true);
    try {
      await verifyMobileEmail({ token: resolvedToken });
      setSuccessMessage('Email verified successfully. Redirecting...');
      router.replace('/(tabs)/home');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Enter your account email to resend verification.');
      return;
    }

    setResending(true);
    try {
      const response = await requestVerificationEmail({ email: normalizedEmail });
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend verification email');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!queryToken || autoVerifyTriggered.current) {
      return;
    }

    autoVerifyTriggered.current = true;
    setToken(queryToken);
    setErrorMessage('');
    setSuccessMessage('');
    setVerifying(true);

    void (async () => {
      try {
        await verifyMobileEmail({ token: queryToken });
        setSuccessMessage('Email verified successfully. Redirecting...');
        router.replace('/(tabs)/home');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email');
      } finally {
        setVerifying(false);
      }
    })();
  }, [queryToken, router]);

  return (
    <AuthScreenFrame
      backPath="/sign-in"
      salutation="Confirm your account"
      description="Open the secure verification link from your email to activate your account and unlock your personalized ministry experience."
      title="Verify your email"
      subtitle="This flow uses the ClaudyGod API email pipeline. If your mail app exposed the token in the URL, you can paste it below."
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
        />
        <AuthTextField
          label="Verification token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          placeholder="Paste verification token if needed"
          returnKeyType="done"
          onSubmitEditing={() => void handleVerify()}
        />
      </View>

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
        title="Verify Email"
        size="lg"
        fullWidth
        loading={verifying}
        loadingLabel="Verifying account"
        loadingVariant="brand"
        onPress={() => void handleVerify()}
        disabled={!canVerify || verifying}
        style={{ marginTop: 16 }}
      />

      <AppButton
        title="Resend Verification Email"
        variant="outline"
        size="md"
        fullWidth
        loading={resending}
        loadingLabel="Resending verification"
        onPress={() => void handleResend()}
        disabled={!canResend || resending}
        style={{ marginTop: 10 }}
      />

      <TVTouchable
        onPress={() => router.replace('/sign-in')}
        style={{ alignSelf: 'center', marginTop: 10 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: 'rgba(220,213,240,0.84)' }}>
          Back to Sign In
        </CustomText>
      </TVTouchable>
    </AuthScreenFrame>
  );
}
