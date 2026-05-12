import React from 'react';
import { ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../components/ui/AppButton';
import { AppScreenFooter } from '../components/layout/AppScreenFooter';
import { CustomText } from '../components/CustomText';
import { Screen } from '../components/layout/Screen';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useGuestMode } from '../context/GuestModeContext';
import { APP_ROUTES } from '../util/appRoutes';

const previewRules = [
  {
    icon: 'visibility' as const,
    title: 'Public preview only',
    text: 'Browse public music, videos, and live updates without opening a saved account.',
  },
  {
    icon: 'lock-outline' as const,
    title: 'Personal features stay locked',
    text: 'Saved library, watch history, notifications, downloads, and settings require sign in.',
  },
  {
    icon: 'person-add-alt' as const,
    title: 'Create an account anytime',
    text: 'Sign up when you are ready to save favourites and personalize the experience.',
  },
];

export default function GuestWelcome() {
  const router = useRouter();
  const { enterGuestMode } = useGuestMode();
  const { width, height } = useWindowDimensions();
  const compact = width < 420;

  const continueGuest = () => {
    enterGuestMode();
    router.replace(APP_ROUTES.tabs.home);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#040308' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#040308" />
      <LinearGradient
        colors={['#040308', '#08050F', '#040308']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={['rgba(124,58,237,0.15)', 'rgba(124,58,237,0)']}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.78, y: 1 }}
          style={{ position: 'absolute', top: -80, left: -70, width: 280, height: 280, borderRadius: 280 }}
        />

        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ minHeight: height, flexGrow: 1, paddingBottom: 20 }}
          >
            <Screen>
              <View style={{ minHeight: height - 24, paddingTop: 10, paddingBottom: 8 }}>
                <View style={{ paddingTop: 14, gap: 18 }}>
                  <View
                    style={{
                      borderRadius: 26,
                      borderWidth: 1,
                      borderColor: 'rgba(185,148,255,0.13)',
                      backgroundColor: 'rgba(10,6,18,0.78)',
                      padding: compact ? 18 : 22,
                    }}
                  >
                    <View style={{ gap: 12 }}>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(185,148,255,0.22)',
                          backgroundColor: 'rgba(255,255,255,0.045)',
                          paddingHorizontal: 11,
                          paddingVertical: 6,
                        }}
                      >
                        <CustomText
                          variant="caption"
                          style={{ color: '#F4EEFF', textTransform: 'uppercase', letterSpacing: 0.72, fontSize: 10.5, lineHeight: 13 }}
                        >
                          Guest preview
                        </CustomText>
                      </View>

                      <CustomText
                        variant="heading"
                        style={{
                          color: '#FFFFFF',
                          fontSize: compact ? 22 : 25,
                          lineHeight: compact ? 29 : 33,
                          letterSpacing: -0.48,
                        }}
                        numberOfLines={3}
                      >
                        Explore public content. Sign in for the full experience.
                      </CustomText>

                      <CustomText
                        variant="body"
                        style={{ color: 'rgba(216,207,232,0.76)', fontSize: 12.2, lineHeight: 19, maxWidth: 620 }}
                      >
                        Guest mode is a controlled preview for visitors. Personal account features remain protected until the user signs in or creates an account.
                      </CustomText>

                      <View style={{ flexDirection: compact ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                        <AppButton
                          title="Create account"
                          size="md"
                          onPress={() => router.replace(APP_ROUTES.auth.signUp)}
                          leftIcon={<MaterialIcons name="person-add-alt" size={15} color="#130A22" />}
                          fullWidth={compact}
                        />
                        <AppButton
                          title="Sign in"
                          variant="secondary"
                          size="md"
                          onPress={() => router.replace(APP_ROUTES.auth.signIn)}
                          leftIcon={<MaterialIcons name="login" size={15} color="#F4EEFF" />}
                          textColor="#F4EEFF"
                          fullWidth={compact}
                          style={{ backgroundColor: 'rgba(255,255,255,0.055)', borderColor: 'rgba(185,148,255,0.13)' }}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 10 }}>
                    {previewRules.map((item) => (
                      <View
                        key={item.title}
                        style={{
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: 'rgba(185,148,255,0.10)',
                          backgroundColor: 'rgba(13,8,22,0.68)',
                          padding: 13,
                        }}
                      >
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                          <View
                            style={{
                              width: 35,
                              height: 35,
                              borderRadius: 18,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(185,148,255,0.11)',
                            }}
                          >
                            <MaterialIcons name={item.icon} size={17} color="#B994FF" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <CustomText variant="label" style={{ color: '#F4EEFF', fontSize: 11.5, lineHeight: 15 }}>
                              {item.title}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: 'rgba(184,175,203,0.72)', marginTop: 3, fontSize: 10.2, lineHeight: 14 }}>
                              {item.text}
                            </CustomText>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View
                    style={{
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: 'rgba(185,148,255,0.12)',
                      backgroundColor: 'rgba(10,6,18,0.64)',
                      padding: compact ? 16 : 18,
                    }}
                  >
                    <View style={{ gap: 10 }}>
                      <CustomText variant="title" style={{ color: '#F4EEFF', fontSize: 15.5, lineHeight: 21 }}>
                        Continue with limited preview
                      </CustomText>
                      <CustomText variant="caption" style={{ color: 'rgba(184,175,203,0.72)', fontSize: 10.3, lineHeight: 15 }}>
                        Browse public content without saving history, favourites, downloads, notifications, or account preferences.
                      </CustomText>
                      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 10, marginTop: 4 }}>
                        <AppButton
                          title="Continue as guest"
                          variant="outline"
                          size="md"
                          onPress={continueGuest}
                          leftIcon={<MaterialIcons name="visibility" size={15} color="#F4EEFF" />}
                          textColor="#F4EEFF"
                          fullWidth={compact}
                          style={{ borderColor: 'rgba(185,148,255,0.18)' }}
                        />
                        <TVTouchable onPress={() => router.replace(APP_ROUTES.landing)} showFocusBorder={false} style={{ justifyContent: 'center', padding: 8 }}>
                          <CustomText variant="label" style={{ color: 'rgba(184,175,203,0.78)', fontSize: 11, lineHeight: 14 }}>
                            Back to welcome
                          </CustomText>
                        </TVTouchable>
                      </View>
                    </View>
                  </View>
                </View>

                <AppScreenFooter variant="landing" compact />
              </View>
            </Screen>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
