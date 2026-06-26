import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { TVTouchable } from '../ui/TVTouchable';
import {
  loginMobileUser,
  loginMobileUserWithGoogle,
  registerMobileUser,
} from '../../services/authService';
import { useUserAccount } from '../../context/UserAccountContext';

type SheetStep = 'choose' | 'email' | 'success';
type EmailMode = 'signin' | 'signup';

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ displayName }: { displayName?: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 16 }}>
      <View
        style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: `${theme.colors.success}16`,
          borderWidth: 1, borderColor: `${theme.colors.success}28`,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <MaterialIcons name="check" size={32} color={theme.colors.success} />
      </View>
      <CustomText style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
        {displayName ? `Welcome, ${displayName}` : 'You\'re signed in'}
      </CustomText>
      <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 20 }}>
        Your library will now sync across all your devices.
      </CustomText>
    </View>
  );
}

// ─── Choose method step ───────────────────────────────────────────────────────

function ChooseMethod({
  onGoogle, onEmail, onSkip, loading,
}: {
  onGoogle: () => void;
  onEmail: () => void;
  onSkip: () => void;
  loading: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 12 }}>
      <TVTouchable
        onPress={onGoogle}
        disabled={loading}
        showFocusBorder={false}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
          height: 54, borderRadius: 16,
          backgroundColor: theme.colors.card,
          borderWidth: 1, borderColor: theme.colors.border,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View
              style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#4285F4',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CustomText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 16 }}>G</CustomText>
            </View>
            <CustomText style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600' }}>
              Continue with Google
            </CustomText>
          </>
        )}
      </TVTouchable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        <CustomText style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>or</CustomText>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
      </View>

      <AppButton
        title="Use email"
        variant="outline"
        size="lg"
        fullWidth
        onPress={onEmail}
        leftIcon={<MaterialIcons name="email" size={17} color={theme.colors.primary} />}
      />

      <TVTouchable
        onPress={onSkip}
        showFocusBorder={false}
        style={{ alignItems: 'center', paddingVertical: 12 }}
      >
        <CustomText style={{ color: theme.colors.textMuted, fontSize: 13.5, fontWeight: '500' }}>
          Skip for now
        </CustomText>
      </TVTouchable>
    </View>
  );
}

// ─── Email form step ──────────────────────────────────────────────────────────

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
  const theme = useAppTheme();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const inputStyle = {
    backgroundColor: theme.colors.subtleFill,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    color: theme.colors.text,
    fontSize: 15,
  } as const;

  return (
    <View style={{ gap: 10 }}>
      {mode === 'signup' ? (
        <TextInput
          placeholder="Your name"
          placeholderTextColor={theme.colors.textMuted}
          value={name}
          onChangeText={onChangeName}
          style={inputStyle}
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
        style={inputStyle}
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
        style={inputStyle}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <View style={{ marginTop: 4 }}>
        <AppButton
          title={loading ? '' : (mode === 'signin' ? 'Sign in' : 'Create account')}
          size="lg"
          fullWidth
          onPress={onSubmit}
          disabled={loading}
          leftIcon={loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
        />
      </View>

      <TVTouchable
        onPress={onToggleMode}
        showFocusBorder={false}
        style={{ alignItems: 'center', paddingVertical: 10 }}
      >
        <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13.5 }}>
          {mode === 'signin' ? "No account? " : "Have an account? "}
          <CustomText style={{ color: theme.colors.primary, fontWeight: '700' }}>
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </CustomText>
        </CustomText>
      </TVTouchable>

      <TVTouchable
        onPress={onBack}
        showFocusBorder={false}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', paddingBottom: 4 }}
      >
        <MaterialIcons name="arrow-back" size={14} color={theme.colors.textMuted} />
        <CustomText style={{ color: theme.colors.textMuted, fontSize: 12 }}>Back</CustomText>
      </TVTouchable>
    </View>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function AccountSheet() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isSheetOpen, closeAccountSheet } = useUserAccount();

  const [step, setStep] = useState<SheetStep>('choose');
  const [mode, setMode] = useState<EmailMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedInName, setSignedInName] = useState('');

  const slideAnim = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (isSheetOpen) {
      // Reset to default state every time sheet opens
      setStep('choose');
      setMode('signin');
      setError('');
      setName('');
      setEmail('');
      setPassword('');
      setLoading(false);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 700,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [isSheetOpen, slideAnim]);

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginMobileUserWithGoogle();
      setSignedInName(result.user.displayName);
      setStep('success');
      setTimeout(() => closeAccountSheet(), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const result = await registerMobileUser({ email, password, displayName: name });
        setSignedInName(result.user.displayName);
      } else {
        const result = await loginMobileUser({ email, password });
        setSignedInName(result.user.displayName);
      }
      setStep('success');
      setTimeout(() => closeAccountSheet(), 1800);
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
    <Modal
      visible={isSheetOpen}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', justifyContent: 'flex-end' }}>
            {/* Sheet card — inner TouchableWithoutFeedback prevents tap-through */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={{
                  transform: [{ translateY: slideAnim }],
                  backgroundColor: theme.colors.surface,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  borderTopWidth: 1,
                  borderColor: theme.colors.border,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 20,
                  paddingHorizontal: 20,
                }}
              >
                {/* Drag handle */}
                <View
                  style={{
                    alignSelf: 'center', width: 36, height: 4,
                    borderRadius: 2, backgroundColor: theme.colors.border,
                    marginBottom: 20,
                  }}
                />

                {step === 'success' ? (
                  <SuccessState displayName={signedInName} />
                ) : (
                  <>
                    {/* Sheet header */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 20,
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1, gap: 5 }}>
                        <CustomText style={{ color: theme.colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 }}>
                          {step === 'email'
                            ? (mode === 'signin' ? 'Welcome back' : 'Create account')
                            : 'Sync your library'}
                        </CustomText>
                        <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 19 }}>
                          {step === 'email'
                            ? (mode === 'signin'
                              ? 'Sign in to access your saved content across devices.'
                              : 'Save your music and favourites across all your devices.')
                            : 'Keep your favourites and listening history — no subscription needed.'}
                        </CustomText>
                      </View>
                      <TVTouchable
                        onPress={dismiss}
                        showFocusBorder={false}
                        style={{
                          width: 34, height: 34, borderRadius: 17,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.subtleFill,
                          marginTop: 2,
                        }}
                      >
                        <MaterialIcons name="close" size={18} color={theme.colors.textMuted} />
                      </TVTouchable>
                    </View>

                    {/* Error banner */}
                    {error ? (
                      <View
                        style={{
                          flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                          backgroundColor: `${theme.colors.danger}12`,
                          borderRadius: 12,
                          borderWidth: 1, borderColor: `${theme.colors.danger}28`,
                          padding: 12,
                          marginBottom: 14,
                        }}
                      >
                        <MaterialIcons name="error-outline" size={16} color={theme.colors.danger} style={{ marginTop: 1 }} />
                        <CustomText style={{ color: theme.colors.danger, fontSize: 12.5, flex: 1, lineHeight: 18 }}>
                          {error}
                        </CustomText>
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
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
