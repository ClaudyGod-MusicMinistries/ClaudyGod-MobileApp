import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';
import { FadeIn } from '../components/ui/FadeIn';
import { AuthBrandPanel } from '../components/auth/AuthBrandPanel';
import { loginMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && !isTV;
  const compact = width < 370;
  const compactViewport = height < 760;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [initializing, isAuthenticated, router]);

  const handleSignIn = async () => {
    setErrorMessage('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginMobileUser({
        email: normalizedEmail,
        password,
      });

      if (session.requiresEmailVerification) {
        router.replace({
          pathname: '/verify-email',
          params: { email: normalizedEmail },
        });
        return;
      }

      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setErrorMessage(message);

      if (/email is not verified/i.test(message)) {
        router.push({
          pathname: '/verify-email',
          params: { email: normalizedEmail },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <StatusBar translucent={false} backgroundColor="#07050F" barStyle="light-content" />

      <LinearGradient
        colors={['rgba(154,107,255,0.42)', 'rgba(15,10,29,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          position: 'absolute',
          left: -44,
          top: -30,
          width: isTablet ? 430 : 320,
          height: isTablet ? 430 : 320,
          borderRadius: 430,
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
                  onPress={() => router.replace('/')}
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
                  <AuthBrandPanel
                    salutation="Welcome back"
                    description="Sign in to continue your worship, messages, playlists, and personalized ministry experience."
                  />
                  <CustomText
                    variant="display"
                    style={{
                      color: '#F8F7FC',
                      fontSize: isTablet ? 28 : 24,
                      lineHeight: isTablet ? 34 : 30,
                    }}
                  >
                    Sign In
                  </CustomText>
                  <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}>
                    Access your secure account to keep your library and playback activity in sync.
                  </CustomText>

                  <View style={{ marginTop: 18, gap: 10 }}>
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
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Email address"
                        placeholderTextColor="rgba(207,200,228,0.65)"
                        style={{
                          minHeight: 52,
                          color: '#F8F7FC',
                          fontSize: 15,
                          fontFamily: 'Sora_400Regular',
                        }}
                      />
                    </View>

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
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={hidePassword}
                        placeholder="Password"
                        placeholderTextColor="rgba(207,200,228,0.65)"
                        style={{
                          flex: 1,
                          minHeight: 52,
                          color: '#F8F7FC',
                          fontSize: 15,
                          fontFamily: 'Sora_400Regular',
                        }}
                      />
                      <TVTouchable
                        onPress={() => setHidePassword((prev) => !prev)}
                        style={{ marginLeft: 10 }}
                        showFocusBorder={false}
                      >
                        <MaterialIcons
                          name={hidePassword ? 'visibility' : 'visibility-off'}
                          size={20}
                          color="rgba(226,218,247,0.9)"
                        />
                      </TVTouchable>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <TVTouchable
                        onPress={() => {
                          const normalizedEmail = email.trim().toLowerCase();
                          if (normalizedEmail) {
                            router.push({
                              pathname: '/verify-email',
                              params: { email: normalizedEmail },
                            });
                            return;
                          }
                          router.push('/verify-email');
                        }}
                        showFocusBorder={false}
                      >
                        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                          Verify email
                        </CustomText>
                      </TVTouchable>

                      <TVTouchable onPress={() => router.push('/forgot-password')} showFocusBorder={false}>
                        <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                          Forgot password?
                        </CustomText>
                      </TVTouchable>
                    </View>
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

                  <AppButton
                    title="Sign In"
                    size="lg"
                    fullWidth
                    loading={submitting}
                    loadingLabel="Signing in"
                    loadingVariant="brand"
                    onPress={() => void handleSignIn()}
                    style={{ marginTop: 16, borderRadius: 16 }}
                  />

                  <TVTouchable
                    onPress={() => router.push('/sign-up')}
                    style={{ alignSelf: 'center', marginTop: 14 }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                      New here? Create Account
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
