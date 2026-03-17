import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { registerMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [initializing, isAuthenticated, router]);

  const canSubmit = useMemo(
    () => Boolean(name.trim() && email.trim() && password.trim() && confirmPassword.trim()),
    [confirmPassword, email, name, password],
  );

  const handleSignUp = async () => {
    setErrorMessage('');

    if (!canSubmit) {
      setErrorMessage('Fill in all fields to continue.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const session = await registerMobileUser({
        displayName: name.trim(),
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath="/"
      salutation="Create your ministry account"
      description="Register once and keep your worship library, saved content, and ministry profile connected across devices."
      title="Create Account"
      subtitle="Use your name and a secure email address to get started."
    >
      <View style={{ gap: 12 }}>
        <AuthTextField
          label="Full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          placeholder="Your full name"
        />

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
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Create a secure password"
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

        <AuthTextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Confirm your password"
        />
      </View>

      <CustomText variant="caption" style={{ color: 'rgba(188,178,214,0.9)', marginTop: 10 }}>
        Your email is used for verification, security notices, and account recovery.
      </CustomText>

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
        title="Create Account"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Creating account"
        loadingVariant="brand"
        onPress={() => void handleSignUp()}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16, borderRadius: 16 }}
      />

      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <CustomText
          variant="body"
          style={{ color: 'rgba(212,205,232,0.82)', textAlign: 'center' }}
        >
          Already have an account?
        </CustomText>
        <TVTouchable
          onPress={() => router.push('/sign-in')}
          style={{ marginTop: 6 }}
          showFocusBorder={false}
        >
          <CustomText variant="label" style={{ color: '#CDB9FF' }}>
            Sign in instead
          </CustomText>
        </TVTouchable>
      </View>
    </AuthScreenFrame>
  );
}
