import React, { useMemo, useState } from 'react';
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
import { getEmailValidationMessage, getNameValidationMessage, getPasswordConfirmationMessage, getPasswordStrengthReport, isLikelyValidEmail, isPasswordCompliant, isValidDisplayName, normalizeEmail } from '../lib/authValidation';
import { isSupabaseConfigured } from '../lib/supabase';
import { loginMobileUserWithGoogle, registerMobileUser } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { useAppModal } from '../context/AppModalContext';
import { APP_ROUTES } from '../util/appRoutes';
import { useDeviceClass } from '../util/deviceClassConfig';


export default function SignUpScreen() {
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { showModal } = useAppModal();
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
  const passwordsMatch = useMemo(() => Boolean(confirmPassword.trim()) && password === confirmPassword, [confirmPassword, password]);
  const nameHint = useMemo(() => getNameValidationMessage(name), [name]);
  const emailHint = useMemo(() => getEmailValidationMessage(email), [email]);
  const confirmHint = useMemo(() => getPasswordConfirmationMessage(password, confirmPassword), [confirmPassword, password]);
  const canSubmit = useMemo(() => Boolean(name.trim() && normalizedEmail && password.trim() && confirmPassword.trim() && nameIsValid && emailIsValid && passwordIsCompliant && passwordsMatch), [confirmPassword, emailIsValid, name, nameIsValid, normalizedEmail, password, passwordIsCompliant, passwordsMatch]);

  const handleSignUp = async () => {
    setErrorMessage('');
    if (!name.trim() || !nameIsValid) { const message = name.trim() ? nameHint : 'Enter your full name to continue.'; setErrorMessage(message); showToast({ title: 'Check your name', message, tone: 'warning' }); return; }
    if (!normalizedEmail || !emailIsValid) { const message = normalizedEmail ? emailHint : 'Enter your email address.'; setErrorMessage(message); showToast({ title: 'Email needed', message, tone: 'warning' }); return; }
    if (!passwordIsCompliant) { const message = 'Use at least 8 characters with uppercase, lowercase, and a number.'; setErrorMessage(message); showToast({ title: 'Strengthen your password', message, tone: 'warning' }); return; }
    if (!confirmPassword.trim() || !passwordsMatch) { const message = 'Passwords do not match.'; setErrorMessage(message); showToast({ title: 'Check your password', message, tone: 'warning' }); return; }
    setSubmitting(true);
    try {
      const session = await registerMobileUser({ displayName: name.trim(), email: normalizedEmail, password });
      if (session.requiresEmailVerification) { router.replace({ pathname: APP_ROUTES.auth.verifyEmail, params: { email: normalizedEmail, notice: session.message ?? 'A verification code has been sent to your email.' } }); showModal({ title: 'Verification code sent', message: 'Check your email to finish creating your account.', tone: 'success' }); showToast({ title: 'Verification code sent', message: 'Check your email to finish creating your account.', tone: 'success' }); return; }
      router.replace(APP_ROUTES.tabs.home);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account right now.';
      setErrorMessage(message); showToast({ title: 'Account creation failed', message, tone: 'error' });
      showModal({ title: 'Account creation failed', message, tone: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setSubmitting(true);
    try {
      await loginMobileUserWithGoogle();
      router.replace(APP_ROUTES.tabs.home);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to continue with Google right now.';
      setErrorMessage(message);
      showModal({ title: 'Google sign-in unavailable', message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.landing}
      salutation="Create your space"
      description="Save favorites, follow live sessions, and continue your worship experience across devices."
      title="Welcome"
      subtitle="Create your account to get started."
    >
      <View style={{ gap: device.isTV ? 15 : 12 }}>
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
          leading={<MaterialIcons name="person-outline" size={18} color="rgba(214,190,255,0.55)" />}
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
          leading={<MaterialIcons name="mail-outline" size={18} color="rgba(214,190,255,0.55)" />}
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
          leading={<MaterialIcons name="lock-outline" size={18} color="rgba(214,190,255,0.55)" />}
          trailing={
            <TVTouchable onPress={() => setHidePassword((prev) => !prev)} showFocusBorder={false}>
              <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={device.isTV ? 24 : 20} color="rgba(238,233,255,0.96)" />
            </TVTouchable>
          }
          hint={password.trim() ? `${passwordReport.label} password` : 'Use a mix of uppercase letters, lowercase letters, and numbers.'}
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
          leading={<MaterialIcons name="lock-outline" size={18} color="rgba(214,190,255,0.55)" />}
          hint={confirmHint || 'Repeat the same password exactly.'}
          hintTone={confirmPassword.trim() ? (passwordsMatch ? 'success' : 'error') : 'default'}
        />
      </View>

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}

      <AppButton
        title="Create account"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Creating account"
        loadingVariant="brand"
        onPress={() => void handleSignUp()}
        disabled={!canSubmit || submitting}
        style={{ marginTop: 16 }}
      />

      {isSupabaseConfigured ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4, marginTop: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(247,242,255,0.10)' }} />
            <CustomText style={{ color: 'rgba(247,242,255,0.35)', fontSize: 11 }}>or continue with</CustomText>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(247,242,255,0.10)' }} />
          </View>
          <AppButton
            title="Continue with Google"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => void handleGoogleSignUp()}
            disabled={submitting}
          />
        </>
      ) : null}

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontSize: 13 }}>
          Already have an account?{' '}
          <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} showFocusBorder={false} style={{ display: 'inline' as never }}>
            <CustomText variant="label" style={{ color: '#E7DCFF', fontSize: 13 }}>Sign in</CustomText>
          </TVTouchable>
        </CustomText>
      </View>
    </AuthScreenFrame>
  );
}
