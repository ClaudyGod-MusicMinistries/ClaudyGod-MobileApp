import React, { useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons , FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AuthFeedbackBanner } from '../components/auth/AuthFeedbackBanner';
import { AuthScreenFrame } from '../components/auth/AuthScreenFrame';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AppButton } from '../components/ui/AppButton';
import { TVTouchable } from '../components/ui/TVTouchable';
import { getEmailValidationMessage, isLikelyValidEmail, normalizeEmail } from '../lib/authValidation';
import { isSupabaseConfigured } from '../lib/supabase';
import { loginMobileUser, loginMobileUserWithGoogle, loginMobileUserWithFacebook } from '../services/authService';
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
        borderColor: 'rgba(214,190,255,0.18)',
        backgroundColor: 'rgba(255,255,255,0.05)',
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
      <CustomText style={{ color: '#F7F2FF', fontSize: 13, fontWeight: '600' }}>
        {isGoogle ? 'Google' : 'Facebook'}
      </CustomText>
    </TVTouchable>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function OrDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(247,242,255,0.10)' }} />
      <CustomText style={{ color: 'rgba(247,242,255,0.35)', fontSize: 11 }}>{label}</CustomText>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(247,242,255,0.10)' }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { showModal } = useAppModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizedEmail = normalizeEmail(email);
  const emailIsValid = !normalizedEmail || isLikelyValidEmail(normalizedEmail);
  const emailHint = getEmailValidationMessage(email);

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
      router.replace(APP_ROUTES.tabs.home);
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

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
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
      showModal({
        title: `${provider === 'google' ? 'Google' : 'Facebook'} sign-in unavailable`,
        message,
        tone: 'error',
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const anyLoading = submitting || socialLoading !== null;

  return (
    <AuthScreenFrame
      backPath={APP_ROUTES.landing}
      salutation="Welcome back"
      description="Pick up your music, videos, live sessions, and saved favorites."
      title="Welcome back"
      subtitle="Sign in to continue your worship experience."
    >
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
          leading={<MaterialIcons name="mail-outline" size={18} color="rgba(214,190,255,0.55)" />}
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
          leading={<MaterialIcons name="lock-outline" size={18} color="rgba(214,190,255,0.55)" />}
          trailing={
            <TVTouchable onPress={() => setHidePassword((p) => !p)} showFocusBorder={false}>
              <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={20} color="rgba(226,218,247,0.9)" />
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
        <CustomText variant="label" style={{ color: '#D8CAFF', fontSize: 12 }}>
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
        loadingVariant="brand"
        onPress={() => void handleSignIn()}
        disabled={anyLoading}
        style={{ marginTop: 16 }}
      />

      {/* Social auth — only when Supabase is configured */}
      {isSupabaseConfigured ? (
        <>
          <OrDivider label="or continue with" />

          {/* Side-by-side social buttons */}
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
        </>
      ) : null}

      {/* Sign-up row — single line with a divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        <CustomText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
          New to ClaudyGod?
        </CustomText>
        <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.18)' }} />
        <TVTouchable
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          showFocusBorder={false}
        >
          <CustomText style={{ color: '#D8CAFF', fontSize: 13, fontWeight: '700' }}>
            Sign up
          </CustomText>
        </TVTouchable>
      </View>
    </AuthScreenFrame>
  );
}
