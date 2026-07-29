import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { AuthFeedbackBanner } from '../../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../../components/auth/AuthScreenFrame';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { PasswordStrengthPanel } from '../../components/auth/PasswordStrengthPanel';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { getEmailValidationMessage, getNameValidationMessage, getPasswordConfirmationMessage, getPasswordStrengthReport, isLikelyValidEmail, isPasswordCompliant, isValidDisplayName, normalizeEmail } from './authValidation';
import { loginMobileUserWithGoogle, loginMobileUserWithFacebook, registerMobileUser } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { useAppModal } from '../../context/AppModalContext';
import { APP_ROUTES } from '../../util/appRoutes';
import { useDeviceClass } from '../../util/deviceClassConfig';

const SUGGEST_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const SUGGEST_LOWER = 'abcdefghjkmnpqrstuvwxyz';
const SUGGEST_DIGITS = '23456789';
const SUGGEST_SPECIAL = '!@#$%&*';

function generateSuggestedPassword(): string {
  const pool = SUGGEST_UPPER + SUGGEST_LOWER + SUGGEST_DIGITS + SUGGEST_SPECIAL;
  let pwd =
    SUGGEST_UPPER[Math.floor(Math.random() * SUGGEST_UPPER.length)] +
    SUGGEST_LOWER[Math.floor(Math.random() * SUGGEST_LOWER.length)] +
    SUGGEST_DIGITS[Math.floor(Math.random() * SUGGEST_DIGITS.length)] +
    SUGGEST_SPECIAL[Math.floor(Math.random() * SUGGEST_SPECIAL.length)];
  for (let i = 4; i < 14; i++) {
    pwd += pool[Math.floor(Math.random() * pool.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}


export default function SignUpScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { showModal } = useAppModal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
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
      if (session.requiresEmailVerification) { router.replace({ pathname: APP_ROUTES.auth.verifyEmail, params: { email: normalizedEmail, notice: session.message ?? 'A verification code has been sent to your email.' } }); showModal({ title: 'Verification code sent', message: 'Check your email to finish creating your account.', tone: 'success' }); return; }
      router.replace(APP_ROUTES.tabs.home);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account right now.';
      setErrorMessage(message);
      showModal({ title: 'Account creation failed', message, tone: 'error' });
    } finally { setSubmitting(false); }
  };

  const anyLoading = submitting || socialLoading !== null;

  const handleSocialSignUp = async (provider: 'google' | 'facebook') => {
    setErrorMessage('');
    setSocialLoading(provider);
    try {
      if (provider === 'google') {
        await loginMobileUserWithGoogle();
      } else {
        await loginMobileUserWithFacebook();
      }
      router.replace(APP_ROUTES.tabs.home);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to continue with ${provider === 'google' ? 'Google' : 'Facebook'} right now.`;
      setErrorMessage(message);
      showModal({ title: `${provider === 'google' ? 'Google' : 'Facebook'} sign-up unavailable`, message, tone: 'error' });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSuggestPassword = () => {
    const suggested = generateSuggestedPassword();
    setPassword(suggested);
    setConfirmPassword(suggested);
    setHidePassword(false);
    showToast({ title: 'Password suggested', message: 'A strong password has been filled in for you. Save it somewhere safe!', tone: 'info' });
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
          leading={<MaterialIcons name="person-outline" size={18} color={theme.colors.textMuted} />}
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
          leading={<MaterialIcons name="mail-outline" size={18} color={theme.colors.textMuted} />}
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
          leading={<MaterialIcons name="lock-outline" size={18} color={theme.colors.textMuted} />}
          trailing={
            <TVTouchable onPress={() => setHidePassword((prev) => !prev)} showFocusBorder={false}>
              <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={device.isTV ? 24 : 20} color={theme.colors.textSecondary} />
            </TVTouchable>
          }
          hint={password.trim() ? `${passwordReport.label} password` : 'Use a mix of uppercase letters, lowercase letters, and numbers.'}
          hintTone={password.trim() ? (passwordIsCompliant ? 'success' : 'error') : 'default'}
        />
        <TVTouchable
          onPress={handleSuggestPassword}
          showFocusBorder={false}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 }}
        >
          <MaterialIcons name="auto-fix-high" size={13} color={theme.colors.secondary} />
          <CustomText style={{ color: theme.colors.secondary, fontSize: 12, fontWeight: '600' }}>
            Suggest a strong password
          </CustomText>
        </TVTouchable>
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
          leading={<MaterialIcons name="lock-outline" size={18} color={theme.colors.textMuted} />}
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
        loadingLabel="Creating account…"
        leftIcon={<MaterialIcons name="person-add" size={17} color="#FFFFFF" />}
        onPress={() => void handleSignUp()}
        disabled={!canSubmit || anyLoading}
        style={{ marginTop: 16 }}
      />

      {/* Social auth */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4, marginTop: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
        <CustomText style={{ color: theme.colors.textMuted, fontSize: 11 }}>or continue with</CustomText>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Google */}
        <TVTouchable
          onPress={() => void handleSocialSignUp('google')}
          disabled={anyLoading}
          showFocusBorder={false}
          style={{
            flex: 1, height: 52, borderRadius: 14,
            borderWidth: 1, borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 10,
            opacity: anyLoading ? 0.5 : 1,
          }}
        >
          {socialLoading === 'google' ? (
            <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4285F4', opacity: 0.8 }} />
            </View>
          ) : (
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="google" size={14} color="#4285F4" />
            </View>
          )}
          <CustomText style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>Google</CustomText>
        </TVTouchable>
        {/* Facebook */}
        <TVTouchable
          onPress={() => void handleSocialSignUp('facebook')}
          disabled={anyLoading}
          showFocusBorder={false}
          style={{
            flex: 1, height: 52, borderRadius: 14,
            borderWidth: 1, borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 10,
            opacity: anyLoading ? 0.5 : 1,
          }}
        >
          {socialLoading === 'facebook' ? (
            <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#1877F2', opacity: 0.8 }} />
            </View>
          ) : (
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="facebook-f" size={14} color="#FFFFFF" />
            </View>
          )}
          <CustomText style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>Facebook</CustomText>
        </TVTouchable>
      </View>

      {/* Already have account — stays on one line */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20 }}>
        <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Already have an account?</CustomText>
        <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} showFocusBorder={false}>
          <CustomText style={{ color: theme.colors.text_accent, fontSize: 13, fontWeight: '700' }}>Sign in</CustomText>
        </TVTouchable>
      </View>
    </AuthScreenFrame>
  );
}
