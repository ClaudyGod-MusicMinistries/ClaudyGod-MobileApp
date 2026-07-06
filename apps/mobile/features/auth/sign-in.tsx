import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { MaterialIcons , FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../util/colorScheme';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { TrustDeviceSheet } from '../components/auth/TrustDeviceSheet';
import { getEmailValidationMessage, isLikelyValidEmail, normalizeEmail } from '../lib/authValidation';
import {
  loginMobileUser,
  loginMobileUserWithGoogle,
  loginMobileUserWithFacebook,
  signInWithTrustedDeviceToken,
} from '../services/authService';
import {
  getTrustedDeviceToken,
  getBiometricType,
  promptBiometric,
} from '../lib/trustedDevice';
import { useToast } from '../context/ToastContext';
import { useAppModal } from '../context/AppModalContext';
import { APP_ROUTES } from '../util/appRoutes';

// ─── Social button ────────────────────────────────────────────────────────────

function SocialButton({
  provider,
  onPress,
  disabled,
}: {
  provider: 'google' | 'facebook';
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const isGoogle = provider === 'google';
  return (
    <TVTouchable
      onPress={onPress}
      disabled={disabled}
      showFocusBorder={false}
      style={{
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {isGoogle ? (
        /* Google G — coloured ring using FontAwesome */
        <View
          style={{
            width: 26, height: 26, borderRadius: 13,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <FontAwesome name="google" size={14} color="#4285F4" />
        </View>
      ) : (
        /* Facebook F */
        <View
          style={{
            width: 26, height: 26, borderRadius: 13,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1877F2',
          }}
        >
          <FontAwesome name="facebook-f" size={14} color="#FFFFFF" />
        </View>
      )}
      <CustomText style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
        {isGoogle ? 'Google' : 'Facebook'}
      </CustomText>
    </TVTouchable>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function OrDivider({ label }: { label: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
      <CustomText style={{ color: theme.colors.textMuted, fontSize: 11 }}>{label}</CustomText>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { showModal } = useAppModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [trustSheetVisible, setTrustSheetVisible] = useState(false);
  const [trustSheetAccessToken, setTrustSheetAccessToken] = useState('');
  const [trustSheetDisplayName, setTrustSheetDisplayName] = useState('');
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');
  const [hasTrustedToken, setHasTrustedToken] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    getBiometricType().then(setBiometricType);
    getTrustedDeviceToken().then((t) => setHasTrustedToken(t !== null));
  }, []);

  const normalizedEmail = normalizeEmail(email);
  const emailIsValid = !normalizedEmail || isLikelyValidEmail(normalizedEmail);
  const emailHint = getEmailValidationMessage(email);

  const showTrustSheet = (accessToken: string, displayName: string) => {
    setTrustSheetAccessToken(accessToken);
    setTrustSheetDisplayName(displayName);
    setTrustSheetVisible(true);
  };

  const handleSignIn = async () => {
    setErrorMessage('');
    if (!normalizedEmail || !password.trim()) {
      const message = 'Enter your email and password to continue.';
      setErrorMessage(message);
      showToast({ title: 'Details needed', message, tone: 'warning' });
      return;
    }
    if (!emailIsValid) {
      setErrorMessage(emailHint);
      showToast({ title: 'Check your email', message: emailHint, tone: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const session = await loginMobileUser({ email: normalizedEmail, password });
      if (session.requiresEmailVerification) {
        router.replace({ pathname: APP_ROUTES.auth.verifyEmail, params: { email: normalizedEmail } });
        return;
      }
      if (session.accessToken && biometricType !== 'none' && !hasTrustedToken) {
        showTrustSheet(session.accessToken, session.user.displayName);
      } else {
        router.replace(APP_ROUTES.tabs.home);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setErrorMessage(message);
      showToast({ title: 'Sign in failed', message, tone: 'error' });
      showModal({ title: 'Sign in failed', message, tone: 'error' });
      if (/email is not verified/i.test(message)) {
        router.push({ pathname: APP_ROUTES.auth.verifyEmail, params: { email: normalizedEmail } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometricSignIn = async () => {
    const stored = await getTrustedDeviceToken();
    if (!stored) { setHasTrustedToken(false); return; }

    const ok = await promptBiometric('Confirm it\'s you to sign in');
    if (!ok) return;

    setBiometricLoading(true);
    try {
      await signInWithTrustedDeviceToken(stored.token);
      router.replace(APP_ROUTES.tabs.home);
    } catch {
      showToast({ title: 'Biometric sign-in failed', message: 'Your trusted session may have expired. Sign in with your password.', tone: 'warning' });
      setHasTrustedToken(false);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    setErrorMessage('');
    setSocialLoading(provider);
    try {
      const session = provider === 'google'
        ? await loginMobileUserWithGoogle()
        : await loginMobileUserWithFacebook();
      if (session?.accessToken && biometricType !== 'none' && !hasTrustedToken) {
        showTrustSheet(session.accessToken, session.user?.displayName ?? '');
      } else {
        router.replace(APP_ROUTES.tabs.home);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to continue with ${provider === 'google' ? 'Google' : 'Facebook'} right now.`;
      setErrorMessage(message);
      showModal({
        title: `${provider === 'google' ? 'Google' : 'Facebook'} sign-in unavailable`,
        message,
        tone: 'error',
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const anyLoading = submitting || socialLoading !== null || biometricLoading;

  const biometricIcon = biometricType === 'face' ? 'face' : 'fingerprint';
  const biometricLabel = biometricType === 'face' ? 'Sign in with Face ID' : 'Sign in with fingerprint';

  return (
    <>
    <TrustDeviceSheet
      visible={trustSheetVisible}
      accessToken={trustSheetAccessToken}
      displayName={trustSheetDisplayName}
      onDismiss={() => { setTrustSheetVisible(false); router.replace(APP_ROUTES.tabs.home); }}
    />
    <AuthScreenFrame
      backPath={APP_ROUTES.landing}
      salutation="Welcome back"
      description="Pick up your music, videos, live sessions, and saved favorites."
      title="Welcome back"
      subtitle="Sign in to continue your worship experience."
    >
      {/* Biometric shortcut — only shown when device has a stored trusted token */}
      {hasTrustedToken && biometricType !== 'none' && (
        <TVTouchable
          onPress={() => void handleBiometricSignIn()}
          disabled={anyLoading}
          showFocusBorder={false}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.colors.primaryBorder,
            backgroundColor: theme.colors.primarySurface,
            opacity: anyLoading ? 0.5 : 1,
          }}
        >
          <MaterialIcons name={biometricIcon} size={22} color={theme.colors.primary} />
          <CustomText style={{ color: theme.colors.text_accent, fontSize: 14, fontWeight: '700' }}>
            {biometricLoading ? 'Verifying…' : biometricLabel}
          </CustomText>
        </TVTouchable>
      )}

      {/* Email/password fields */}
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
          leading={<MaterialIcons name="mail-outline" size={18} color={theme.colors.textMuted} />}
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
          leading={<MaterialIcons name="lock-outline" size={18} color={theme.colors.textMuted} />}
          trailing={
            <TVTouchable onPress={() => setHidePassword((p) => !p)} showFocusBorder={false}>
              <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={20} color={theme.colors.textSecondary} />
            </TVTouchable>
          }
        />
      </View>

      {/* Forgot password */}
      <TVTouchable
        onPress={() => router.push(APP_ROUTES.auth.forgotPassword)}
        style={{ alignSelf: 'flex-end', marginTop: 12 }}
        showFocusBorder={false}
      >
        <CustomText variant="label" style={{ color: theme.colors.text_accent, fontSize: 12 }}>
          Forgot password?
        </CustomText>
      </TVTouchable>

      {errorMessage ? <AuthFeedbackBanner message={errorMessage} tone="error" /> : null}

      {/* Primary sign-in button */}
      <AppButton
        title="Sign in"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Signing in…"
        leftIcon={<MaterialIcons name="login" size={17} color="#FFFFFF" />}
        onPress={() => void handleSignIn()}
        disabled={anyLoading}
        style={{ marginTop: 16 }}
      />

      {/* Social auth — always visible */}
      <OrDivider label="or continue with" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SocialButton
          provider="google"
          onPress={() => void handleSocialSignIn('google')}
          disabled={anyLoading}
        />
        <SocialButton
          provider="facebook"
          onPress={() => void handleSocialSignIn('facebook')}
          disabled={anyLoading}
        />
      </View>

      {/* Sign in with email code (passwordless) */}
      <TVTouchable
        onPress={() => router.push(APP_ROUTES.auth.emailOtp)}
        disabled={anyLoading}
        showFocusBorder={false}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
          opacity: anyLoading ? 0.5 : 1,
        }}
      >
        <MaterialIcons name="mail-outline" size={17} color={theme.colors.textMuted} />
        <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
          Sign in with email code
        </CustomText>
      </TVTouchable>

      {/* Sign-up row — single line with a divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
        <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
          New to ClaudyGod?
        </CustomText>
        <View style={{ width: 1, height: 12, backgroundColor: theme.colors.divider }} />
        <TVTouchable
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          showFocusBorder={false}
        >
          <CustomText style={{ color: theme.colors.text_accent, fontSize: 13, fontWeight: '700' }}>
            Sign up
          </CustomText>
        </TVTouchable>
      </View>
    </AuthScreenFrame>
    </>
  );
}
