import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { TVTouchable } from '../components/ui/TVTouchable';
import { Screen } from '../components/layout/Screen';

export default function SignUpScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const compact = width < 360 || height < 740;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  const canSubmit = useMemo(
    () => Boolean(name.trim() && email.trim() && password.trim() && confirmPassword.trim()),
    [confirmPassword, email, name, password],
  );

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={{ flex: 1, backgroundColor: '#06040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#06040D" />
      <LinearGradient
        colors={['#130A29', '#06040D', '#06040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: compact ? 8 : 16 }}>
              <TVTouchable
                onPress={() => router.back()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.16)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  marginBottom: 12,
                }}
                showFocusBorder={false}
              >
                <MaterialIcons name="arrow-back" size={20} color="#F8F7FC" />
              </TVTouchable>

              <Animated.View
                style={{
                  opacity: fade,
                  transform: [{ translateY: rise }],
                  width: '100%',
                  alignSelf: 'center',
                  maxWidth: isTablet ? 580 : 520,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(10,8,17,0.92)',
                  padding: compact ? 16 : 20,
                }}
              >
                <CustomText variant="display" style={{ color: '#F8F7FC', fontSize: 20, lineHeight: 25 }}>
                  Create your account
                </CustomText>
                <CustomText variant="body" style={{ marginTop: 6, color: 'rgba(203,196,226,0.88)' }}>
                  Save your profile, most played content, live notifications and playlists.
                </CustomText>

                <View style={{ marginTop: 14, gap: 10 }}>
                  <Field>
                    <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="rgba(207,200,228,0.62)" style={inputStyle} />
                  </Field>
                  <Field>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="Email address"
                      placeholderTextColor="rgba(207,200,228,0.62)"
                      style={inputStyle}
                    />
                  </Field>
                  <Field row>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={hidePassword}
                      placeholder="Password"
                      placeholderTextColor="rgba(207,200,228,0.62)"
                      style={[inputStyle, { flex: 1 }]}
                    />
                    <TVTouchable onPress={() => setHidePassword((v) => !v)} showFocusBorder={false}>
                      <MaterialIcons name={hidePassword ? 'visibility' : 'visibility-off'} size={20} color="rgba(226,218,247,0.9)" />
                    </TVTouchable>
                  </Field>
                  <Field>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={hidePassword}
                      placeholder="Confirm password"
                      placeholderTextColor="rgba(207,200,228,0.62)"
                      style={inputStyle}
                    />
                  </Field>
                </View>

                <View style={{ marginTop: 14 }}>
                  <AppButton
                    title="Create Account"
                    size="lg"
                    fullWidth
                    disabled={!canSubmit}
                    onPress={() => router.replace('/(tabs)/home')}
                    style={{ borderRadius: 16 }}
                  />
                  <CustomText variant="caption" style={{ color: 'rgba(184,175,209,0.86)', marginTop: 8 }}>
                    Create your account to save playlists, favorites, and preferences.
                  </CustomText>
                </View>

                <TVTouchable onPress={() => router.push('/sign-in')} showFocusBorder={false} style={{ alignSelf: 'center', marginTop: 14 }}>
                  <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                    Already have an account? Sign In
                  </CustomText>
                </TVTouchable>
              </Animated.View>
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Field({ children, row }: { children: React.ReactNode; row?: boolean }) {
  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 14,
        flexDirection: row ? 'row' : 'column',
        alignItems: row ? 'center' : undefined,
      }}
    >
      {children}
    </View>
  );
}

const inputStyle = {
  minHeight: 50,
  color: '#F8F7FC',
  fontSize: 14,
  fontFamily: 'SpaceGrotesk_500Medium',
} as const;
