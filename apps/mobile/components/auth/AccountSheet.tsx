import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { TVTouchable } from '../ui/TVTouchable';
import { BottomSheet } from '../ui/BottomSheet';
import { TrustDeviceSheet } from './TrustDeviceSheet';
import {
  loginMobileUser,
  loginMobileUserWithGoogle,
  registerMobileUser,
  signInWithTrustedDeviceToken,
} from '../../services/authService';
import { useAccountSheet } from '../../context/AccountSheetContext';
import {
  isTrustedDeviceSupported,
  getBiometricType,
  getTrustedDeviceToken,
  promptBiometric,
  clearTrustedDeviceToken,
} from '../../lib/trustedDevice';

// The two Modal-based sheets must never be visible at once, and BottomSheet's
// exit animation (internal, not exported) takes ~220ms — this outlasts it so
// AccountSheet is fully gone before TrustDeviceSheet mounts.
const SHEET_HANDOFF_DELAY_MS = 260;

type SheetStep = 'choose' | 'email' | 'success' | 'trustedUnlock';
type EmailMode = 'signin' | 'signup';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  flex1: { flex: 1 },

  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 20, gap: 12,
  },
  titleContainer:  { flex: 1, gap: 5 },
  titleText:       { color: theme.colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  subtitleText:    { color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 19 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
    marginTop: 2,
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: `${theme.colors.danger}12`,
    borderRadius: theme.radius.card,
    borderWidth: 1, borderColor: `${theme.colors.danger}28`,
    padding: 12, marginBottom: 14,
  },
  errorIconShift: { marginTop: 1 },
  errorText:      { color: theme.colors.danger, fontSize: 12.5, flex: 1, lineHeight: 18 },

  successContainer: { alignItems: 'center', paddingVertical: 24, gap: 16 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle:    { color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  successSubtitle: { color: theme.colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },

  chooseGap:   { gap: 12 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    height: 54, borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  googleCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
  },
  googleLetter:  { color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  googleLabel:   { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  dividerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerLabel:  { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' },
  skipBtn:       { alignItems: 'center', paddingVertical: 12 },
  skipText:      { color: theme.colors.textMuted, fontSize: 13.5, fontWeight: '500' },

  formGap:    { gap: 10 },
  inputField: {
    backgroundColor:  theme.colors.subtleFill,
    borderRadius:     12,
    borderWidth:      1,
    borderColor:      theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical:   Platform.OS === 'ios' ? 14 : 11,
    color:            theme.colors.text,
    fontSize:         15,
  },
  submitMargin:     { marginTop: 4 },
  toggleModeBtn:    { alignItems: 'center', paddingVertical: 10 },
  toggleModeText:   { color: theme.colors.textSecondary, fontSize: 13.5 },
  toggleModeAccent: { color: theme.colors.primary, fontWeight: '700' },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', paddingBottom: 4 },
  backText: { color: theme.colors.textMuted, fontSize: 12 },

  trustedContainer: { alignItems: 'center', paddingVertical: 12, gap: 16 },
  trustedIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  trustedTitle:    { color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  trustedSubtitle: { color: theme.colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  trustedActions:  { width: '100%', gap: 10, marginTop: 4 },
}));

// ─── SuccessState ─────────────────────────────────────────────────────────────

function SuccessState({ displayName }: { displayName?: string }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <View style={styles.successContainer}>
      <View style={[styles.successIcon, {
        backgroundColor: `${theme.colors.success}16`,
        borderWidth: 1, borderColor: `${theme.colors.success}28`,
      }]}>
        <MaterialIcons name="check" size={32} color={theme.colors.success} />
      </View>
      <CustomText style={styles.successTitle}>
        {displayName ? `Welcome, ${displayName}` : "You're signed in"}
      </CustomText>
      <CustomText style={styles.successSubtitle}>
        Your library will now sync across all your devices.
      </CustomText>
    </View>
  );
}

// ─── TrustedUnlock ────────────────────────────────────────────────────────────

function TrustedUnlock({
  biometricIcon, biometricLabel, loading, onUnlock, onUseAnotherWay,
}: {
  biometricIcon: React.ComponentProps<typeof MaterialIcons>['name'];
  biometricLabel: string;
  loading: boolean;
  onUnlock: () => void;
  onUseAnotherWay: () => void;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <View style={styles.trustedContainer}>
      <View style={[styles.trustedIcon, {
        backgroundColor: theme.colors.primarySurface,
        borderWidth: 1, borderColor: theme.colors.primaryBorder,
      }]}>
        <MaterialIcons name={biometricIcon} size={32} color={theme.colors.primary} />
      </View>
      <CustomText style={styles.trustedTitle}>Welcome back</CustomText>
      <CustomText style={styles.trustedSubtitle}>
        Use {biometricLabel} to sign in instantly on this device.
      </CustomText>
      <View style={styles.trustedActions}>
        <AppButton
          title={`Sign in with ${biometricLabel}`}
          size="lg"
          fullWidth
          loading={loading}
          loadingLabel="Verifying…"
          leftIcon={<MaterialIcons name={biometricIcon} size={18} color={theme.colors.onPrimary} />}
          onPress={onUnlock}
        />
        <TVTouchable onPress={onUseAnotherWay} showFocusBorder={false} style={styles.skipBtn}>
          <CustomText style={styles.skipText}>Use another way</CustomText>
        </TVTouchable>
      </View>
    </View>
  );
}

// ─── ChooseMethod ─────────────────────────────────────────────────────────────

function ChooseMethod({
  onGoogle, onEmail, onSkip, loading,
}: {
  onGoogle: () => void;
  onEmail: () => void;
  onSkip: () => void;
  loading: boolean;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <View style={styles.chooseGap}>
      <TVTouchable
        onPress={onGoogle}
        disabled={loading}
        showFocusBorder={false}
        style={[styles.googleBtn, { opacity: loading ? 0.6 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View style={styles.googleCircle}>
              <CustomText style={styles.googleLetter}>G</CustomText>
            </View>
            <CustomText style={styles.googleLabel}>Continue with Google</CustomText>
          </>
        )}
      </TVTouchable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <CustomText style={styles.dividerLabel}>or</CustomText>
        <View style={styles.dividerLine} />
      </View>

      <AppButton
        title="Use email"
        variant="outline"
        size="lg"
        fullWidth
        onPress={onEmail}
        leftIcon={<MaterialIcons name="email" size={17} color={theme.colors.primary} />}
      />

      <TVTouchable onPress={onSkip} showFocusBorder={false} style={styles.skipBtn}>
        <CustomText style={styles.skipText}>Skip for now</CustomText>
      </TVTouchable>
    </View>
  );
}

// ─── EmailForm ────────────────────────────────────────────────────────────────

function EmailForm({
  mode, name, email, password, loading,
  onChangeName, onChangeEmail, onChangePassword,
  onSubmit, onToggleMode, onBack,
}: {
  mode: EmailMode;
  name: string;
  email: string;
  password: string;
  loading: boolean;
  onChangeName: (_v: string) => void;
  onChangeEmail: (_v: string) => void;
  onChangePassword: (_v: string) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
  onBack: () => void;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <View style={styles.formGap}>
      {mode === 'signup' ? (
        <TextInput
          placeholder="Your name"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={onChangeName}
          style={styles.inputField}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      ) : null}

      <TextInput
        ref={emailRef}
        placeholder="Email address"
        placeholderTextColor={theme.colors.textMuted}
        value={email}
        onChangeText={onChangeEmail}
        style={styles.inputField}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <TextInput
        ref={passwordRef}
        placeholder="Password"
        placeholderTextColor={theme.colors.textMuted}
        value={password}
        onChangeText={onChangePassword}
        style={styles.inputField}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <View style={styles.submitMargin}>
        <AppButton
          title={loading ? '' : (mode === 'signin' ? 'Sign in' : 'Create account')}
          size="lg"
          fullWidth
          onPress={onSubmit}
          disabled={loading}
          leftIcon={loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
        />
      </View>

      <TVTouchable onPress={onToggleMode} showFocusBorder={false} style={styles.toggleModeBtn}>
        <CustomText style={styles.toggleModeText}>
          {mode === 'signin' ? 'No account? ' : 'Have an account? '}
          <CustomText style={styles.toggleModeAccent}>
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </CustomText>
        </CustomText>
      </TVTouchable>

      <TVTouchable onPress={onBack} showFocusBorder={false} style={styles.backBtn}>
        <MaterialIcons name="arrow-back" size={14} color={theme.colors.textMuted} />
        <CustomText style={styles.backText}>Back</CustomText>
      </TVTouchable>
    </View>
  );
}

// ─── AccountSheet ─────────────────────────────────────────────────────────────

export function AccountSheet() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { isSheetOpen, closeAccountSheet } = useAccountSheet();

  const [step, setStep]             = useState<SheetStep>('choose');
  const [mode, setMode]             = useState<EmailMode>('signin');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [signedInName, setSignedInName] = useState('');
  const [pendingTrust, setPendingTrust] = useState<{ accessToken: string; displayName: string } | null>(null);
  const [trustedToken, setTrustedToken] = useState<{ token: string; deviceLabel: string } | null>(null);
  const [biometricIcon, setBiometricIcon] = useState<React.ComponentProps<typeof MaterialIcons>['name']>('fingerprint');
  const [biometricLabel, setBiometricLabel] = useState('Biometrics');

  useEffect(() => {
    if (isSheetOpen) {
      setStep('choose');
      setMode('signin');
      setError('');
      setName('');
      setEmail('');
      setPassword('');
      setLoading(false);
      setTrustedToken(null);

      // A registered trusted-device token was previously write-only here — it
      // got stored after sign-in but nothing ever checked for one on a later
      // open, so returning users always saw the full form again. Check once,
      // every time the sheet opens, and offer a biometric shortcut instead.
      void (async () => {
        const stored = await getTrustedDeviceToken();
        if (!stored) return;
        const type = await getBiometricType();
        if (!isTrustedDeviceSupported() || type === 'none') return;
        setBiometricIcon(type === 'face' ? 'face' : 'fingerprint');
        setBiometricLabel(type === 'face' ? 'Face ID' : 'Touch ID / Fingerprint');
        setTrustedToken({ token: stored.token, deviceLabel: stored.deviceLabel });
        setStep('trustedUnlock');
      })();
    }
  }, [isSheetOpen]);

  const handleTrustedUnlock = async () => {
    if (!trustedToken) return;
    const confirmed = await promptBiometric("Confirm it's you to sign in");
    if (!confirmed) return;
    setLoading(true);
    setError('');
    try {
      const result = await signInWithTrustedDeviceToken(trustedToken.token);
      setSignedInName(result.user.displayName);
      setStep('success');
      setTimeout(() => closeAccountSheet(), 1400);
    } catch {
      await clearTrustedDeviceToken();
      setTrustedToken(null);
      setStep('choose');
      setError('Your trusted session has expired. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  // After a successful sign-in, offer biometric quick-sign-in next time if the
  // device supports it — otherwise fall back to the previous plain auto-close.
  const finishSignIn = async (accessToken: string | undefined, displayName: string) => {
    setSignedInName(displayName);
    setStep('success');

    const canOfferTrust = Boolean(accessToken) && isTrustedDeviceSupported() && (await getBiometricType()) !== 'none';
    if (canOfferTrust && accessToken) {
      setTimeout(() => {
        closeAccountSheet();
        setTimeout(() => setPendingTrust({ accessToken, displayName }), SHEET_HANDOFF_DELAY_MS);
      }, 1200);
    } else {
      setTimeout(() => closeAccountSheet(), 1800);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginMobileUserWithGoogle();
      await finishSignIn(result.accessToken, result.user.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Enter your name to create an account.'); return; }
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const result = await registerMobileUser({ email, password, displayName: name });
        await finishSignIn(result.accessToken, result.user.displayName);
      } else {
        const result = await loginMobileUser({ email, password });
        await finishSignIn(result.accessToken, result.user.displayName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    if (loading) return;
    Keyboard.dismiss();
    closeAccountSheet();
  };

  return (
    <>
    <BottomSheet visible={isSheetOpen} onClose={dismiss} dismissible={!loading}>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 'success' ? (
          <SuccessState displayName={signedInName} />
        ) : step === 'trustedUnlock' ? (
          <TrustedUnlock
            biometricIcon={biometricIcon}
            biometricLabel={biometricLabel}
            loading={loading}
            onUnlock={() => void handleTrustedUnlock()}
            onUseAnotherWay={() => { setTrustedToken(null); setError(''); setStep('choose'); }}
          />
        ) : (
          <>
            <View style={styles.sheetHeader}>
              <View style={styles.titleContainer}>
                <CustomText style={styles.titleText}>
                  {step === 'email'
                    ? (mode === 'signin' ? 'Welcome back' : 'Create account')
                    : 'Sync your library'}
                </CustomText>
                <CustomText style={styles.subtitleText}>
                  {step === 'email'
                    ? (mode === 'signin'
                      ? 'Sign in to access your saved content across devices.'
                      : 'Save your music and favourites across all your devices.')
                    : 'Keep your favourites and listening history — no subscription needed.'}
                </CustomText>
              </View>
              <TVTouchable onPress={dismiss} showFocusBorder={false} style={styles.closeBtn}>
                <MaterialIcons name="close" size={18} color={theme.colors.textMuted} />
              </TVTouchable>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color={theme.colors.danger} style={styles.errorIconShift} />
                <CustomText style={styles.errorText}>{error}</CustomText>
              </View>
            ) : null}

            {step === 'choose' ? (
              <ChooseMethod
                onGoogle={() => void handleGoogle()}
                onEmail={() => { setStep('email'); setMode('signin'); setError(''); }}
                onSkip={dismiss}
                loading={loading}
              />
            ) : (
              <EmailForm
                mode={mode}
                name={name}
                email={email}
                password={password}
                loading={loading}
                onChangeName={setName}
                onChangeEmail={setEmail}
                onChangePassword={setPassword}
                onSubmit={() => void handleEmailSubmit()}
                onToggleMode={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                onBack={() => { setStep('choose'); setError(''); }}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </BottomSheet>

    <TrustDeviceSheet
      visible={pendingTrust !== null}
      accessToken={pendingTrust?.accessToken ?? ''}
      displayName={pendingTrust?.displayName ?? ''}
      onDismiss={() => setPendingTrust(null)}
    />
    </>
  );
}
