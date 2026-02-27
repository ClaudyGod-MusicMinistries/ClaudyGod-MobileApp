import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';
import { FadeIn } from '../components/ui/FadeIn';
import { requestVerificationEmail, verifyMobileEmail } from '../services/authService';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ email?: string | string[]; token?: string | string[] }>();

  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && !isTV;
  const compact = width < 370;
  const compactViewport = height < 760;

  const [email, setEmail] = useState(() => getParam(params.email).trim().toLowerCase());
  const [token, setToken] = useState(() => getParam(params.token).trim());
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const autoVerifyTriggered = useRef(false);

  const canVerify = useMemo(() => Boolean(token.trim()), [token]);
  const canResend = useMemo(() => Boolean(email.trim()), [email]);

  const handleVerify = async (tokenValue?: string) => {
    setErrorMessage('');
    setSuccessMessage('');

    const resolvedToken = (tokenValue ?? token).trim();
    if (!resolvedToken) {
      setErrorMessage('Enter your verification token.');
      return;
    }

    setVerifying(true);
    try {
      await verifyMobileEmail({ token: resolvedToken });
      setSuccessMessage('Email verified successfully. Redirecting...');
      router.replace('/(tabs)/home');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Enter your account email to resend verification.');
      return;
    }

    setResending(true);
    try {
      const response = await requestVerificationEmail({ email: normalizedEmail });
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to resend verification email');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const tokenFromQuery = getParam(params.token).trim();
    if (!tokenFromQuery || autoVerifyTriggered.current) {
      return;
    }

    autoVerifyTriggered.current = true;
    setToken(tokenFromQuery);
    setErrorMessage('');
    setSuccessMessage('');
    setVerifying(true);

    void (async () => {
      try {
        await verifyMobileEmail({ token: tokenFromQuery });
        setSuccessMessage('Email verified successfully. Redirecting...');
        router.replace('/(tabs)/home');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to verify email');
      } finally {
        setVerifying(false);
      }
    })();
  }, [params.token, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <StatusBar translucent={false} backgroundColor="#07050F" barStyle="light-content" />

      <LinearGradient
        colors={['rgba(154,107,255,0.30)', 'rgba(15,10,29,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          position: 'absolute',
          left: -44,
          top: -34,
          width: isTablet ? 420 : 320,
          height: isTablet ? 420 : 320,
          borderRadius: 420,
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: isWeb ? 0 : 20,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          scrollEnabled={!isWeb || compactViewport}
          keyboardShouldPersistTaps="handled"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1, justifyContent: 'center' }}>
            <FadeIn>
              <View style={{ paddingTop: compactViewport ? 4 : 10 }}>
                <TVTouchable
                  onPress={() => router.back()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={22} color="#F8F7FC" />
                </TVTouchable>

                <View
                  style={{
                    marginTop: compactViewport ? 12 : 16,
                    width: '100%',
                    maxWidth: isTV ? 760 : isTablet ? 560 : '100%',
                    alignSelf: 'center',
                    borderRadius: 24,
                    padding: isTablet ? 24 : compactViewport ? 14 : compact ? 16 : 20,
                    backgroundColor: 'rgba(13,10,22,0.90)',
                    borderWidth: 1,
                    borderColor: 'rgba(235,226,255,0.14)',
                  }}
                >
                  <CustomText
                    variant="display"
                    style={{
                      color: '#F8F7FC',
                      fontSize: isTablet ? 30 : 26,
                      lineHeight: isTablet ? 36 : 31,
                    }}
                  >
                    Verify Email
                  </CustomText>
                  <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}>
                    Confirm your account with the token we sent to your email.
                  </CustomText>

                  <View style={{ marginTop: 16, gap: 10 }}>
                    <AuthField
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Account email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <AuthField
                      value={token}
                      onChangeText={setToken}
                      placeholder="Verification token"
                      autoCapitalize="none"
                    />
                  </View>

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

                  {successMessage ? (
                    <View
                      style={{
                        marginTop: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(122,230,166,0.35)',
                        backgroundColor: 'rgba(56,170,104,0.14)',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <CustomText variant="caption" style={{ color: '#D4FFE4' }}>
                        {successMessage}
                      </CustomText>
                    </View>
                  ) : null}

                  <AppButton
                    title="Verify Email"
                    size="lg"
                    fullWidth
                    loading={verifying}
                    onPress={() => void handleVerify()}
                    disabled={!canVerify || verifying}
                    style={{ marginTop: 16, borderRadius: 16 }}
                  />

                  <AppButton
                    title="Resend Verification Email"
                    variant="ghost"
                    size="lg"
                    fullWidth
                    loading={resending}
                    onPress={() => void handleResend()}
                    disabled={!canResend || resending}
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(233,221,255,0.32)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                    }}
                  />

                  <TVTouchable
                    onPress={() => router.replace('/sign-in')}
                    style={{ alignSelf: 'center', marginTop: 12 }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                      Back to Sign In
                    </CustomText>
                  </TVTouchable>
                </View>
              </View>
            </FadeIn>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AuthField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  value: string;
  onChangeText: (_text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 14,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor="rgba(207,200,228,0.68)"
        style={{
          minHeight: 52,
          color: '#F8F7FC',
          fontSize: 14,
          fontFamily: 'SpaceGrotesk_500Medium',
        }}
      />
    </View>
  );
}
