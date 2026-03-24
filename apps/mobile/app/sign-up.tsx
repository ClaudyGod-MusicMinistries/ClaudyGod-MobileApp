import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { PasswordStrengthPanel } from '../components/auth/PasswordStrengthPanel';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import {
  getEmailValidationMessage,
  getNameValidationMessage,
  getPasswordConfirmationMessage,
  getPasswordStrengthReport,
  isLikelyValidEmail,
  isPasswordCompliant,
  isValidDisplayName,
  normalizeEmail,
} from '../lib/authValidation';
import { registerMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { APP_ROUTES } from '../util/appRoutes';

export default function SignUpScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const nameIsValid = useMemo(() => isValidDisplayName(name), [name]);
  const emailIsValid = useMemo(() => isLikelyValidEmail(normalizedEmail), [normalizedEmail]);
  const passwordReport = useMemo(() => getPasswordStrengthReport(password), [password]);
  const passwordIsCompliant = useMemo(() => isPasswordCompliant(password), [password]);
  const passwordsMatch = useMemo(
    () => Boolean(confirmPassword.trim()) && password === confirmPassword,
    [confirmPassword, password],
  );
  const nameHint = useMemo(() => getNameValidationMessage(name), [name]);
  const emailHint = useMemo(() => getEmailValidationMessage(email), [email]);
  const confirmHint = useMemo(
    () => getPasswordConfirmationMessage(password, confirmPassword),
    [confirmPassword, password],
  );

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace(APP_ROUTES.tabs.home);
    }
  }, [initializing, isAuthenticated, router]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        name.trim() &&
          normalizedEmail &&
          password.trim() &&
          confirmPassword.trim() &&
          nameIsValid &&
          emailIsValid &&
          passwordIsCompliant &&
          passwordsMatch,
      ),
    [
      confirmPassword,
      emailIsValid,
      name,
      nameIsValid,
      normalizedEmail,
      password,
      passwordIsCompliant,
      passwordsMatch,
    ],
  );

  const handleSignUp = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      const message = 'Enter your full name to continue.';
      setErrorMessage(message);
      showToast({ title: 'Name required', message, tone: 'warning' });
      return;
    }
    if (!nameIsValid) {
      setErrorMessage(nameHint);
      showToast({ title: 'Check your name', message: nameHint, tone: 'warning' });
      return;
    }
    if (!normalizedEmail) {
      const message = 'Enter the email address you want tied to this account.';
      setErrorMessage(message);
      showToast({ title: 'Email required', message, tone: 'warning' });
      return;
    }
    if (!emailIsValid) {
      setErrorMessage(emailHint);
      showToast({ title: 'Email needs attention', message: emailHint, tone: 'warning' });
      return;
    }
    if (!password.trim()) {
      const message = 'Create a password before continuing.';
      setErrorMessage(message);
      showToast({ title: 'Password required', message, tone: 'warning' });
      return;
    }
    if (!passwordIsCompliant) {
      const message = 'Use at least 8 characters with uppercase, lowercase, and a number.';
      setErrorMessage(message);
      showToast({ title: 'Strengthen your password', message, tone: 'warning' });
      return;
    }
    if (!confirmPassword.trim() || !passwordsMatch) {
      const message = 'Passwords do not match.';
      setErrorMessage(message);
      showToast({ title: 'Password confirmation mismatch', message, tone: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const session = await registerMobileUser({
        displayName: name.trim(),
        email: normalizedEmail,
        password,
      });

      if (session.requiresEmailVerification) {
        router.replace({
          pathname: APP_ROUTES.auth.verifyEmail,
          params: {
            email: normalizedEmail,
            notice: session.message ?? 'A verification code has been sent to your email.',
          },
        });
        showToast({
          title: 'Verification code sent',
          message: 'Check your inbox and enter the 6-digit code to finish creating the account.',
          tone: 'success',
        });
        return;
      }

      router.replace(APP_ROUTES.tabs.home);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account';
      setErrorMessage(message);
      showToast({ title: 'Account creation failed', message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.landing}
      salutation="Create your account"
      description="Create your profile and keep your listening in sync."
      title="Create Account"
      subtitle="Enter your details and confirm your email with a 6-digit code."
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
          hint={nameHint}
          hintTone={name.trim() ? (nameIsValid ? 'success' : 'error') : 'default'}
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
          hint={emailHint}
          hintTone={normalizedEmail ? (emailIsValid ? 'success' : 'error') : 'default'}
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
          hint={password.trim() ? `${passwordReport.label} password` : 'Use a mix of letters and numbers to protect this account.'}
          hintTone={password.trim() ? (passwordIsCompliant ? 'success' : 'error') : 'default'}
        />

        {password.trim() ? <PasswordStrengthPanel password={password} /> : null}

        <AuthTextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={hidePassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Confirm your password"
          hint={confirmHint}
          hintTone={confirmPassword.trim() ? (passwordsMatch ? 'success' : 'error') : 'default'}
        />
      </View>

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}

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
          onPress={() => router.push(APP_ROUTES.auth.signIn)}
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
