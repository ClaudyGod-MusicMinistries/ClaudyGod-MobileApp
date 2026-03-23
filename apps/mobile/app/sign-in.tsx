import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { getEmailValidationMessage, isLikelyValidEmail, normalizeEmail } from '../lib/authValidation';
import { loginMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { APP_ROUTES } from '../util/appRoutes';

export default function SignInScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const normalizedEmail = normalizeEmail(email);
  const emailIsValid = !normalizedEmail || isLikelyValidEmail(normalizedEmail);
  const emailHint = getEmailValidationMessage(email);

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace(APP_ROUTES.tabs.home);
    }
  }, [initializing, isAuthenticated, router]);

  const handleSignIn = async () => {
    setErrorMessage('');
    if (!normalizedEmail || !password.trim()) {
      const message = 'Enter your email and password.';
      setErrorMessage(message);
      showToast({ title: 'Missing sign-in details', message, tone: 'warning' });
      return;
    }

    if (!emailIsValid) {
      setErrorMessage(emailHint);
      showToast({ title: 'Check your email address', message: emailHint, tone: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginMobileUser({
        email: normalizedEmail,
        password,
      });

      if (session.requiresEmailVerification) {
        router.replace({
          pathname: APP_ROUTES.auth.verifyEmail,
          params: { email: normalizedEmail },
        });
        return;
      }

      router.replace(APP_ROUTES.tabs.home);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setErrorMessage(message);
      showToast({ title: 'Sign in failed', message, tone: 'error' });

      if (/email is not verified/i.test(message)) {
        router.push({
          pathname: APP_ROUTES.auth.verifyEmail,
          params: { email: normalizedEmail },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.landing}
      salutation="Welcome back"
      description="Sign in to continue listening, watching, and saving."
      title="Sign In"
      subtitle="Use your email and password to continue."
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
        />

        <AuthTextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          placeholder="Enter your password"
          trailing={
            <TVTouchable onPress={() => setHidePassword((prev) => !prev)} showFocusBorder={false}>
              <MaterialIcons
                name={hidePassword ? 'visibility' : 'visibility-off'}
                size={20}
                color="rgba(226,218,247,0.9)"
              />
            </TVTouchable>
          }
        />
      </View>

      <TVTouchable
        onPress={() => router.push(APP_ROUTES.auth.forgotPassword)}
        style={{ alignSelf: 'flex-end', marginTop: 12 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
          Forgot password?
        </CustomText>
      </TVTouchable>

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}

      <AppButton
        title="Sign In"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Signing in"
        loadingVariant="brand"
        onPress={() => void handleSignIn()}
        disabled={submitting}
        style={{ marginTop: 16, borderRadius: 16 }}
      />

      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <CustomText
          variant="body"
          style={{ color: 'rgba(212,205,232,0.82)', textAlign: 'center' }}
        >
          Don&apos;t have an account yet?
        </CustomText>
        <TVTouchable
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          style={{ marginTop: 6 }}
          showFocusBorder={false}
        >
          <CustomText variant="label" style={{ color: '#CDB9FF' }}>
            Create your account
          </CustomText>
        </TVTouchable>
      </View>
    </AuthScreenFrame>
  );
}
