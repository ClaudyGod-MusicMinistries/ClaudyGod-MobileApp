import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { loginMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [initializing, isAuthenticated, router]);

  const handleSignIn = async () => {
    setErrorMessage('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setErrorMessage('Enter your email and password.');
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
          pathname: '/verify-email',
          params: { email: normalizedEmail },
        });
        return;
      }

      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setErrorMessage(message);

      if (/email is not verified/i.test(message)) {
        router.push({
          pathname: '/verify-email',
          params: { email: normalizedEmail },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath="/"
      salutation="Welcome back"
      description="Continue your worship journey with your saved music, messages, and ministry updates in one place."
      title="Sign In"
      subtitle="Use your account email and password to continue."
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
        onPress={() => router.push('/forgot-password')}
        style={{ alignSelf: 'flex-end', marginTop: 12 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
          Forgot password?
        </CustomText>
      </TVTouchable>

      {errorMessage ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,120,120,0.25)',
            backgroundColor: 'rgba(255,80,80,0.08)',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <CustomText variant="caption" style={{ color: '#FFD6D6' }}>
            {errorMessage}
          </CustomText>
        </View>
      ) : null}

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
          onPress={() => router.push('/sign-up')}
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
