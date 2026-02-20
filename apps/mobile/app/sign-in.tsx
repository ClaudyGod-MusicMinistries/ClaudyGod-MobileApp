import React, { useState } from 'react';
import { ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';

function SocialGlassButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(231,221,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={icon} size={18} color="#EFE7FF" />
      <CustomText variant="body" style={{ color: '#EFE7FF' }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 370;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <StatusBar translucent={false} backgroundColor="#07050F" barStyle="light-content" />

      <LinearGradient
        colors={['rgba(154,107,255,0.45)', 'rgba(15,10,29,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', left: -40, top: -20, width: 320, height: 320, borderRadius: 320 }}
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
                  padding: compact ? 16 : 20,
                  backgroundColor: 'rgba(13,10,22,0.86)',
                  borderWidth: 1,
                  borderColor: 'rgba(235,226,255,0.12)',
                }}
              >
                <CustomText variant="display" style={{ color: '#F8F7FC' }}>
                  Sign In
                </CustomText>
                <CustomText variant="body" style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}>
                  Access your songs, videos, playlists, and personalized ministry flow.
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
                        fontSize: 14,
                        fontFamily: 'SpaceGrotesk_500Medium',
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
                        fontSize: 14,
                        fontFamily: 'SpaceGrotesk_500Medium',
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

                  <TVTouchable
                    onPress={() => console.log('forgot password')}
                    style={{ alignSelf: 'flex-end' }}
                    showFocusBorder={false}
                  >
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
                  style={{ marginTop: 16, borderRadius: 16 }}
                />

                <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                  <CustomText variant="caption" style={{ color: 'rgba(187,178,211,0.86)' }}>
                    Or continue with
                  </CustomText>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
                  <SocialGlassButton
                    icon="g-translate"
                    label="Google"
                    onPress={() => console.log('google sign in')}
                  />
                  <SocialGlassButton
                    icon="apple"
                    label="Apple"
                    onPress={() => console.log('apple sign in')}
                  />
                </View>

                <TVTouchable
                  onPress={() => router.push('/sign-up')}
                  style={{ alignSelf: 'center', marginTop: 12 }}
                  showFocusBorder={false}
                >
                  <CustomText variant="label" style={{ color: '#CDB9FF' }}>
                    New here? Create Account
                  </CustomText>
                </TVTouchable>
              </View>
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
