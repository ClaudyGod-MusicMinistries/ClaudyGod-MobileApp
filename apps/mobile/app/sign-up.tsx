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
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';
import { FadeIn } from '../components/ui/FadeIn';

export default function SignUpScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isTablet = width >= 768 && !isTV;
  const compact = width < 370;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  const canSubmit = useMemo(
    () => Boolean(name.trim() && email.trim() && password.trim() && confirmPassword.trim()),
    [confirmPassword, email, name, password],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <StatusBar translucent={false} backgroundColor="#07050F" barStyle="light-content" />

      <LinearGradient
        colors={['rgba(154,107,255,0.32)', 'rgba(15,10,29,0)']}
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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1, justifyContent: 'center' }}>
            <FadeIn>
              <View style={{ paddingTop: 10 }}>
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
                    marginTop: 16,
                    width: '100%',
                    maxWidth: isTV ? 760 : isTablet ? 560 : '100%',
                    alignSelf: 'center',
                    borderRadius: 24,
                    padding: isTablet ? 24 : compact ? 16 : 20,
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
                    Create Account
                  </CustomText>
                  <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}>
                    Set up your workspace for ministry music, videos, and channel updates.
                  </CustomText>

                  <View style={{ marginTop: 16, gap: 10 }}>
                    <AuthField value={name} onChangeText={setName} placeholder="Full name" />
                    <AuthField
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <AuthField
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
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
                      placeholder="Confirm password"
                      secureTextEntry={hidePassword}
                    />
                  </View>

                  <AppButton
                    title="Create Account"
                    size="lg"
                    fullWidth
                    onPress={() => router.replace('/(tabs)/home')}
                    disabled={!canSubmit}
                    style={{ marginTop: 16, borderRadius: 16 }}
                  />

                  <TVTouchable
                    onPress={() => router.push('/sign-in')}
                    style={{ alignSelf: 'center', marginTop: 12 }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                      Already have an account? Sign In
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
  secureTextEntry,
  trailing,
}: {
  value: string;
  onChangeText: (_text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
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
        keyboardType={keyboardType}
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
