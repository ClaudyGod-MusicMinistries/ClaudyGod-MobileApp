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

const secureIndex = (length: number): number => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoApi.getRandomValues(values);
    return values[0] % length;
  }
  return Math.floor(Math.random() * length);
};

const generatePasswordSuggestion = (): string => {
  const words = ['Grace', 'Signal', 'Anchor', 'Crown', 'Harbor', 'Studio', 'Cedar', 'Summit'];
  const symbols = ['!', '#', '%', '?', '@'];
  const number = 1000 + secureIndex(9000);
  return `${words[secureIndex(words.length)]}${words[secureIndex(words.length)]}${symbols[secureIndex(symbols.length)]}${number}`;
};

export default function SignUpScreen() {
  const router = useRouter();
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

  const handleSuggestPassword = () => {
    const suggestion = generatePasswordSuggestion();
    setPassword(suggestion);
    setConfirmPassword(suggestion);
    setHidePassword(false);
    showToast({ title: 'Secure password suggested', message: 'Review it before creating your account.', tone: 'success' });
  };

  return (
    <AuthScreenFrame backPath={APP_ROUTES.landing} salutation="Create your space" description="Save favorites, follow live sessions, and continue your worship experience across devices." title="Create account" subtitle="Continue with Google or create a protected email account.">
      <View style={{ gap: 12 }}>
        <AuthTextField label="Full name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" textContentType="name" placeholder="Your full name" hint={nameHint} hintTone={name.trim() ? (nameIsValid ? 'success' : 'error') : 'default'} />
        <AuthTextField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="name@example.com" hint={emailHint} hintTone={normalizedEmail ? (emailIsValid ? 'success' : 'error') : 'default'} />
        <AuthTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry={hidePassword} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" placeholder="Create a secure password" trailing={<TVTouchable onPress={() => setHidePassword((prev) => !prev)} showFocusBorder={false}><MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={20} color="rgba(226,218,247,0.9)" /></TVTouchable>} hint={password.trim() ? `${passwordReport.label} password` : 'Use a mix of letters and numbers.'} hintTone={password.trim() ? (passwordIsCompliant ? 'success' : 'error') : 'default'} />
        <AppButton title="Suggest secure password" variant="secondary" size="sm" onPress={handleSuggestPassword} disabled={submitting} leftIcon={<MaterialIcons name="auto-fix-high" size={16} color="rgba(226,218,247,0.9)" />} style={{ alignSelf: 'flex-start' }} />
        {password.trim() ? <PasswordStrengthPanel password={password} /> : null}
        <AuthTextField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={hidePassword} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" placeholder="Confirm your password" hint={confirmHint} hintTone={confirmPassword.trim() ? (passwordsMatch ? 'success' : 'error') : 'default'} />
      </View>
      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}
      {isSupabaseConfigured ? (
        <AppButton title="Continue with Google" variant="secondary" size="lg" fullWidth onPress={() => void handleGoogleSignUp()} disabled={submitting} style={{ marginTop: 16 }} />
      ) : null}
      <AppButton title="Create account" size="lg" fullWidth loading={submitting} loadingLabel="Creating account" loadingVariant="brand" onPress={() => void handleSignUp()} disabled={!canSubmit || submitting} style={{ marginTop: isSupabaseConfigured ? 10 : 16 }} />
      <View style={{ alignItems: 'center', marginTop: 16 }}><CustomText variant="body" style={{ color: 'rgba(255,255,255,0.68)', textAlign: 'center' }}>Already have an account?</CustomText><TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} style={{ marginTop: 7 }} showFocusBorder={false}><CustomText variant="label" style={{ color: '#D8CAFF' }}>Sign in instead</CustomText></TVTouchable></View>
    </AuthScreenFrame>
  );
}
