import React, { useState } from 'react';
import { ScrollView, StatusBar, TextInput, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { Screen } from '../components/layout/Screen';
import { useAppTheme } from '../util/colorScheme';
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
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 370;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={['rgba(154,107,255,0.45)', 'rgba(15,10,29,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', left: -40, top: -20, width: 320, height: 320, borderRadius: 320 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 70, paddingBottom: 40, flexGrow: 1 }}
      >
        <Screen>
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
              marginTop: 24,
              borderRadius: 24,
              padding: compact ? 16 : 20,
              backgroundColor: 'rgba(13,10,22,0.86)',
              borderWidth: 1,
              borderColor: 'rgba(235,226,255,0.12)',
            }}
          >
            <CustomText
              variant="display"
              style={{
                color: '#F8F7FC',
                fontSize: 28,
                lineHeight: 34,
                fontFamily: 'ClashDisplay_700Bold',
                fontWeight: '700',
              }}
            >
              Sign In
            </CustomText>
            <CustomText
              variant="body"
              style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}
            >
              Access your songs, watch lists, and personalized worship flow.
            </CustomText>

            <View style={{ marginTop: 20, gap: 12 }}>
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
              style={{ marginTop: 18, borderRadius: 16 }}
            />

            <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <CustomText variant="caption" style={{ color: 'rgba(187,178,211,0.86)' }}>
                Or continue with
              </CustomText>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            </View>

            <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
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

            <CustomText
              variant="caption"
              style={{ marginTop: 16, color: 'rgba(174,166,197,0.8)', textAlign: 'center' }}
            >
              New here? Continue with guest mode and personalize later.
            </CustomText>
          </View>

          <TVTouchable
            onPress={() => router.replace('/(tabs)/home')}
            style={{ alignSelf: 'center', marginTop: 16 }}
            showFocusBorder={false}
          >
            <CustomText variant="label" style={{ color: theme.colors.accent }}>
              Skip for now
            </CustomText>
          </TVTouchable>
        </Screen>
      </ScrollView>
    </View>
  );
}
