import React, { useEffect, useMemo, useState } from 'react';
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
import { registerMobileUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const { height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const compactViewport = height < 760;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [initializing, isAuthenticated, router]);

  const canSubmit = useMemo(
    () => Boolean(name.trim() && email.trim() && password.trim() && confirmPassword.trim()),
    [confirmPassword, email, name, password],
  );

  const handleSignUp = async () => {
    setErrorMessage('');

    if (!canSubmit) {
      setErrorMessage('Fill in all fields to continue.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const session = await registerMobileUser({
        displayName: name.trim(),
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account');
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
                    Create your account
                  </CustomText>
                  <CustomText
                    style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.7)',
                      textAlign: 'center',
                      lineHeight: 24,
                    }}
                  >
                    Join the worship community and start your journey
                  </CustomText>
                </View>
              </View>

              {/* Form */}
              <View style={{ gap: 16 }}>
                {/* Name field */}
                <View>
                  <CustomText
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#FFFFFF',
                      marginBottom: 8,
                    }}
                  >
                    Full Name
                  </CustomText>
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
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>

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
                      placeholder="Create a password"
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

                {/* Confirm password field */}
                <View>
                  <CustomText
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: '#FFFFFF',
                      marginBottom: 8,
                    }}
                  >
                    Confirm Password
                  </CustomText>
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
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={hidePassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                      }}
                    />
                  </View>
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

                {/* Sign up button */}
                <AppButton
                  title="Create Account"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  loadingLabel="Creating account..."
                  onPress={() => void handleSignUp()}
                  disabled={!canSubmit || submitting}
                  style={{
                    backgroundColor: '#1DB954',
                    borderRadius: 25,
                    marginTop: 8,
                  }}
                />

                {/* Terms and conditions */}
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  <CustomText
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.6)',
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    By creating an account, you agree to our{' '}
                    <CustomText
                      style={{
                        color: '#1DB954',
                        textDecorationLine: 'underline',
                      }}
                    >
                      Terms of Service
                    </CustomText>{' '}
                    and{' '}
                    <CustomText
                      style={{
                        color: '#1DB954',
                        textDecorationLine: 'underline',
                      }}
                    >
                      Privacy Policy
                    </CustomText>
                  </CustomText>
                </View>

                {/* Sign in link */}
                <View style={{ alignItems: 'center', marginTop: 24 }}>
                  <CustomText
                    style={{
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    Already have an account?{' '}
                    <CustomText
                      style={{
                        color: '#1DB954',
                        fontWeight: '600',
                      }}
                      onPress={() => router.push('/sign-in')}
                    >
                      Sign in
                    </CustomText>
                  </CustomText>
                </View>
              </View>
            </FadeIn>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
