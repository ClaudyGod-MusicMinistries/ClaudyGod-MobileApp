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
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';
import { FadeIn } from '../components/ui/FadeIn';
import { loginMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const { height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
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
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar translucent={false} backgroundColor="#121212" barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingBottom: 40,
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
              {/* Header with back button */}
              <View style={{ marginBottom: 40 }}>
                <TVTouchable
                  onPress={() => router.replace('/')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TVTouchable>

                {/* Logo and branding */}
                <View style={{ alignItems: 'center', marginBottom: 48 }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <MaterialIcons name="music-note" size={40} color="#1DB954" />
                  </View>
                  <CustomText
                    style={{
                      fontSize: 28,
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    ClaudyGod
                  </CustomText>
                  <CustomText
                    style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.7)',
                      textAlign: 'center',
                    }}
                  >
                    Music & Worship
                  </CustomText>
                </View>

                {/* Welcome text */}
                <View style={{ marginBottom: 32 }}>
                  <CustomText
                    style={{
                      fontSize: 24,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      marginBottom: 8,
                    }}
                  >
                    Welcome back
                  </CustomText>
                  <CustomText
                    style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.7)',
                      textAlign: 'center',
                      lineHeight: 24,
                    }}
                  >
                    Sign in to continue your worship journey
                  </CustomText>
                </View>
              </View>

              {/* Form */}
              <View style={{ gap: 16 }}>
                {/* Email field */}
                <View>
                  <CustomText
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#FFFFFF',
                      marginBottom: 8,
                    }}
                  >
                    Email
                  </CustomText>
                  </View>
                  <View
                    style={{
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>

                {/* Password field */}
                <View>
                  <CustomText
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#FFFFFF',
                      marginBottom: 8,
                    }}
                  >
                    Password
                  </CustomText>
                  <View
                    style={{
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={hidePassword}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      style={{
                        flex: 1,
                        color: '#FFFFFF',
                        fontSize: 16,
                      }}
                    />
                    <TVTouchable
                      onPress={() => setHidePassword((prev) => !prev)}
                      style={{ padding: 4 }}
                      showFocusBorder={false}
                    >
                      <MaterialIcons
                        name={hidePassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                    </TVTouchable>
                  </View>
                </View>

                {/* Forgot password */}
                <View style={{ alignItems: 'flex-end' }}>
                  <TVTouchable
                    onPress={() => router.push('/forgot-password')}
                    showFocusBorder={false}
                  >
                    <CustomText
                      style={{
                        fontSize: 14,
                        color: '#1DB954',
                        fontWeight: '500',
                      }}
                    >
                      Forgot password?
                    </CustomText>
                  </TVTouchable>
                </View>

                {/* Error message */}
                {errorMessage ? (
                  <View
                    style={{
                      borderRadius: 8,
                      backgroundColor: 'rgba(255,59,48,0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,59,48,0.3)',
                      padding: 12,
                    }}
                  >
                    <CustomText
                      style={{
                        color: '#FF3B30',
                        fontSize: 14,
                        textAlign: 'center',
                      }}
                    >
                      {errorMessage}
                    </CustomText>
                  </View>
                ) : null}

                {/* Sign in button */}
                <AppButton
                  title="Sign In"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  loadingLabel="Signing in..."
                  onPress={() => void handleSignIn()}
                  style={{
                    backgroundColor: '#1DB954',
                    borderRadius: 25,
                    marginTop: 8,
                  }}
                />

                {/* Sign up link */}
                <View style={{ alignItems: 'center', marginTop: 24 }}>
                  <CustomText
                    style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    Don&apos;t have an account?{' '}
                  </CustomText>
                  <TVTouchable onPress={() => router.push('/sign-up')} showFocusBorder={false}>
                    <CustomText
                      style={{
                        color: '#1DB954',
                        fontWeight: '600',
                        fontSize: 16,
                      }}
                    >
                      Sign up
                    </CustomText>
                  </TVTouchable>
              </View>
            </FadeIn>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
