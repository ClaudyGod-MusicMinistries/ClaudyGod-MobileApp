import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthOtpInput } from '../components/auth/AuthOtpInput';
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
    notice?: string | string[];
    token?: string | string[];
    token_hash?: string | string[];
  }>();

  const queryToken = useMemo(
    () => getParam(params.token).trim() || getParam(params.token_hash).trim(),
    [params.token, params.token_hash],
  );
  const legacyToken = queryToken.length > 6 ? queryToken : '';
  const initialCode = queryToken.length <= 6 ? queryToken : '';

  const [email, setEmail] = useState(() => getParam(params.email).trim().toLowerCase());
  const [token, setToken] = useState(initialCode);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(() => getParam(params.notice).trim());

  const autoVerifyTriggered = useRef(false);

  const canVerify = useMemo(() => token.trim().length === 6, [token]);
  const canResend = useMemo(() => Boolean(email.trim()) && resendCooldown === 0, [email, resendCooldown]);

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

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (tokenValue?: string) => {
    setErrorMessage('');
    setSuccessMessage('');

    const resolvedToken = (tokenValue ?? token).trim();
    if (!resolvedToken) {
      setErrorMessage('Enter the 6-digit verification code from your email.');
      return;
    }

    setVerifying(true);
    try {
      await verifyMobileEmail({ token: resolvedToken, email: email.trim().toLowerCase() });
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
      setResendCooldown(45);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend verification email');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!legacyToken || autoVerifyTriggered.current) {
      return;
    }

    autoVerifyTriggered.current = true;
    setErrorMessage('');
    setSuccessMessage('');
    setVerifying(true);

    void (async () => {
      try {
        await verifyMobileEmail({ token: legacyToken, email: email.trim().toLowerCase() });
        setSuccessMessage('Email verified successfully. Redirecting...');
        router.replace('/(tabs)/home');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email');
      } finally {
        setVerifying(false);
      }
    })();
  }, [email, legacyToken, router]);

  return (
    <AuthScreenFrame
      backPath="/sign-in"
      salutation="Confirm your account"
      description="Enter the 6-digit verification code sent to your registered email to finish creating your account and unlock your personalized ministry experience."
      title="Verify your email"
      subtitle="We only create your account after the email code is confirmed. If you open an older verification link on this device, it will still complete automatically."
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
        {legacyToken ? (
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
              Older verification link detected. We already attempted to complete it for you. If it
              was expired, enter the latest 6-digit code from your email below.
            </CustomText>
          </View>
        ) : null}
        <AuthOtpInput
          label="Verification code"
          value={token}
          onChangeText={setToken}
          placeholder="Paste or type the 6-digit code"
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
        title="Verify Code"
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

      {resendCooldown > 0 ? (
        <CustomText
          variant="caption"
          style={{ color: 'rgba(202,196,220,0.72)', marginTop: 9, textAlign: 'center' }}
        >
          You can request another code in {resendCooldown}s.
        </CustomText>
      ) : null}

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
