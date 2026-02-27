import React, { useMemo, useState } from 'react';
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
import { resetMobilePassword } from '../services/authService';

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();

  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && !isTV;
  const compact = width < 370;
  const compactViewport = height < 760;

  const [token, setToken] = useState(() => getParam(params.token).trim());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canSubmit = useMemo(
    () => Boolean(token.trim() && newPassword.trim() && confirmPassword.trim()),
    [confirmPassword, newPassword, token],
  );

  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!token.trim()) {
      setErrorMessage('Enter the reset token from your email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetMobilePassword({
        token: token.trim(),
        newPassword,
      });
      setSuccessMessage(response.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

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
                    Reset Password
                  </CustomText>
                  <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}>
                    Paste your reset token and set a new password.
                  </CustomText>

                  <View style={{ marginTop: 16, gap: 10 }}>
                    <AuthField
                      value={token}
                      onChangeText={setToken}
                      placeholder="Reset token"
                      autoCapitalize="none"
                    />
                    <AuthField
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="New password"
                      secureTextEntry={hidePassword}
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
                    <AuthField
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      secureTextEntry={hidePassword}
                    />
                  </View>

                  <CustomText variant="caption" style={{ color: 'rgba(188,178,214,0.9)', marginTop: 10 }}>
                    Password must include uppercase, lowercase, and number, with at least 8 characters.
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
                    title="Update Password"
                    size="lg"
                    fullWidth
                    loading={submitting}
                    onPress={() => void handleResetPassword()}
                    disabled={!canSubmit || submitting}
                    style={{ marginTop: 16, borderRadius: 16 }}
                  />

                  <TVTouchable
                    onPress={() => {
                      const normalizedEmail = getParam(params.email).trim().toLowerCase();
                      if (normalizedEmail) {
                        router.push({
                          pathname: '/forgot-password',
                          params: { email: normalizedEmail },
                        });
                        return;
                      }
                      router.push('/forgot-password');
                    }}
                    style={{ alignSelf: 'center', marginTop: 12 }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                      Need a new reset token?
                    </CustomText>
                  </TVTouchable>

                  <TVTouchable
                    onPress={() => router.replace('/sign-in')}
                    style={{ alignSelf: 'center', marginTop: 8 }}
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
  autoCapitalize,
  secureTextEntry,
  trailing,
}: {
  value: string;
  onChangeText: (_text: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor="rgba(207,200,228,0.68)"
        style={{
          flex: 1,
          minHeight: 52,
          color: '#F8F7FC',
          fontSize: 14,
          fontFamily: 'SpaceGrotesk_500Medium',
        }}
      />
      {trailing ? <View style={{ marginLeft: 10 }}>{trailing}</View> : null}
    </View>
  );
}
