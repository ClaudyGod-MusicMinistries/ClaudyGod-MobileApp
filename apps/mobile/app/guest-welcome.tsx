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
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useGuestMode } from '../context/GuestModeContext';
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';

const previewRules = [
  {
    icon: 'visibility' as const,
    title: 'Preview public content',
    text: 'Guest mode is for exploring public music, videos, and live updates only.',
  },
  {
    icon: 'lock-outline' as const,
    title: 'No saved account access',
    text: 'Library saves, personal history, notifications, and account settings require sign in.',
  },
  {
    icon: 'person-add-alt' as const,
    title: 'Create an account anytime',
    text: 'Sign up when you are ready to save favourites and personalize the experience.',
  },
];

export default function GuestWelcome() {
  const theme = useAppTheme();
  const router = useRouter();
  const { enterGuestMode } = useGuestMode();
  const { width } = useWindowDimensions();
  const compact = width < 420;

  const continueGuest = () => {
    enterGuestMode();
    router.replace(APP_ROUTES.tabs.home);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <LinearGradient
        colors={theme.scheme === 'dark' ? ['rgba(76,29,149,0.22)', theme.colors.background] : ['rgba(124,58,237,0.12)', theme.colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
            <Screen>
              <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap }}>
                <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 12 }}>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: theme.radius.pill,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.04)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}>
                        Guest preview
                      </CustomText>
                    </View>

                    <CustomText variant="display" style={{ color: theme.colors.text }} numberOfLines={2}>
                      Explore first. Sign in when you want the full experience.
                    </CustomText>

                    <CustomText variant="body" style={{ color: theme.colors.textSecondary, maxWidth: 620 }}>
                      Guest mode gives visitors a controlled preview of public ClaudyGod content. Personal features stay protected until the user signs in or creates an account.
                    </CustomText>

                    <View style={{ flexDirection: compact ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                      <AppButton
                        title="Create account"
                        size="md"
                        onPress={() => router.replace(APP_ROUTES.auth.signUp)}
                        leftIcon={<MaterialIcons name="person-add-alt" size={17} color={theme.colors.textInverse} />}
                        fullWidth={compact}
                      />
                      <AppButton
                        title="Sign in"
                        variant="secondary"
                        size="md"
                        onPress={() => router.replace(APP_ROUTES.auth.signIn)}
                        leftIcon={<MaterialIcons name="login" size={17} color={theme.colors.text} />}
                        fullWidth={compact}
                      />
                    </View>
                  </View>
                </SurfaceCard>

                <View style={{ gap: 10 }}>
                  {previewRules.map((item) => (
                    <SurfaceCard key={item.title} tone="subtle" style={{ padding: theme.spacing.md }}>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
                          }}
                        >
                          <MaterialIcons name={item.icon} size={18} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <CustomText variant="label" style={{ color: theme.colors.text }}>
                            {item.title}
                          </CustomText>
                          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
                            {item.text}
                          </CustomText>
                        </View>
                      </View>
                    </SurfaceCard>
                  ))}
                </View>

                <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 10 }}>
                    <CustomText variant="title" style={{ color: theme.colors.text }}>
                      Continue with limited preview
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                      Use this only when you want to browse public content without saving history, favourites, downloads, notifications, or account preferences.
                    </CustomText>
                    <View style={{ flexDirection: compact ? 'column' : 'row', gap: 10, marginTop: 4 }}>
                      <AppButton
                        title="Continue as guest"
                        variant="outline"
                        size="md"
                        onPress={continueGuest}
                        leftIcon={<MaterialIcons name="visibility" size={17} color={theme.colors.text} />}
                        fullWidth={compact}
                      />
                      <TVTouchable onPress={() => router.replace(APP_ROUTES.landing)} showFocusBorder={false} style={{ justifyContent: 'center', padding: 8 }}>
                        <CustomText variant="label" style={{ color: theme.colors.textSecondary }}>
                          Back to welcome
                        </CustomText>
                      </TVTouchable>
                    </View>
                  </View>
                </SurfaceCard>

                <AppScreenFooter compact />
              </View>
            </Screen>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
