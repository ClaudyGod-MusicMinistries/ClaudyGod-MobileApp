import React, { useMemo, useState } from 'react';
import { ScrollView, StatusBar, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';

export default function SignUpScreen() {
  const router = useRouter();

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
        style={{ position: 'absolute', left: -40, top: -30, width: 320, height: 320, borderRadius: 320 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 26 }}>
          <Screen>
            <View style={{ paddingTop: 16 }}>
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
                  marginTop: 18,
                  borderRadius: 22,
                  padding: 18,
                  backgroundColor: 'rgba(13,10,22,0.86)',
                  borderWidth: 1,
                  borderColor: 'rgba(235,226,255,0.12)',
                }}
              >
                <CustomText variant="display" style={{ color: '#F8F7FC' }}>
                  Create Account
                </CustomText>
                <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}>
                  Set up your workspace for music, videos, and ministry channels.
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

              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <CustomText variant="caption" style={{ color: 'rgba(177,170,201,0.74)' }}>
                  ClaudyGod Music Ministries
                </CustomText>
              </View>
            </View>
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
