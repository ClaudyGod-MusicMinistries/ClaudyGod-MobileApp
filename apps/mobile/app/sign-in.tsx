import React, { useEffect, useRef, useState } from 'react';
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

export default function SignInScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const compact = width < 360 || height < 720;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const pulse = useRef(new Animated.Value(0.94)).current;

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

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, pulse, rise]);

  const logoSize = isTablet ? 72 : compact ? 54 : 60;

  return (
    <View style={{ flex: 1, backgroundColor: '#06040D' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#06040D" />
      <LinearGradient
        colors={['#120A26', '#06040D', '#06040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: 'rgba(154,107,255,0.14)',
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                  maxWidth: isTablet ? 560 : 520,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(10,8,17,0.92)',
                  padding: compact ? 16 : 20,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: logoSize + 18,
                      height: logoSize + 18,
                      borderRadius: (logoSize + 18) / 2,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.14)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ scale: pulse }],
                    }}
                  >
                    <Animated.Image
                      source={require('../assets/images/ClaudyGoLogo.webp')}
                      style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
                    />
                  </Animated.View>

                  <CustomText variant="display" style={{ color: '#F8F7FC', marginTop: 14, fontSize: 20, lineHeight: 25 }}>
                    Sign in to ClaudyGod
                  </CustomText>
                  <CustomText
                    variant="body"
                    style={{ marginTop: 6, color: 'rgba(203,196,226,0.88)', textAlign: 'center', maxWidth: 460 }}
                  >
                    Continue to music, videos, live channels, playlists and your listening history.
                  </CustomText>
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
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
                      <MaterialIcons
                        name={hidePassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color="rgba(226,218,247,0.92)"
                      />
                    </TVTouchable>
                  </Field>

                  <TVTouchable onPress={() => undefined} showFocusBorder={false} style={{ alignSelf: 'flex-end' }}>
                    <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                      Forgot password?
                    </CustomText>
                  </TVTouchable>
                </View>

                <AppButton
                  title="Sign In"
                  size="lg"
                  fullWidth
                  onPress={() => router.replace('/(tabs)/home')}
                  style={{ marginTop: 14, borderRadius: 16 }}
                />

                <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                  <CustomText variant="caption" style={{ color: 'rgba(187,178,211,0.86)' }}>
                    Or continue with
                  </CustomText>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                </View>

                <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
                  <GhostSocial icon="g-translate" label="Google" />
                  <GhostSocial icon="apple" label="Apple" />
                </View>

                <TVTouchable onPress={() => router.push('/sign-up')} showFocusBorder={false} style={{ alignSelf: 'center', marginTop: 14 }}>
                  <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                    New here? Create Account
                  </CustomText>
                </TVTouchable>
              </Animated.View>

              <View style={{ marginTop: 12 }}>
                <CustomText variant="caption" style={{ color: 'rgba(167,158,192,0.86)', textAlign: 'center' }}>
                  Secure sign-in for your account
                </CustomText>
              </View>
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function GhostSocial({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  return (
    <TVTouchable
      onPress={() => undefined}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(231,221,255,0.22)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={17} color="#EFE7FF" />
      <CustomText variant="body" style={{ color: '#EFE7FF' }}>
        {label}
      </CustomText>
    </TVTouchable>
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
