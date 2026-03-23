import React from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../components/layout/Screen';
import { CustomText } from '../components/CustomText';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AppButton } from '../components/ui/AppButton';
import { CinematicHeroCard } from '../components/sections/CinematicHeroCard';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_HERO_ASSET, BRAND_LOGO_ASSET } from '../util/brandAssets';

const DESTINATIONS = [
  { key: 'music', icon: 'graphic-eq', label: 'Music', route: APP_ROUTES.tabs.player },
  { key: 'videos', icon: 'smart-display', label: 'Videos', route: APP_ROUTES.tabs.videos },
  { key: 'library', icon: 'library-music', label: 'Library', route: APP_ROUTES.tabs.library },
] as const;

function DestinationCard({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 10,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(139,92,246,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.24)',
        }}
      >
        <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const primaryAction = isAuthenticated
    ? { title: 'Continue', route: APP_ROUTES.tabs.home }
    : { title: 'Create Account', route: APP_ROUTES.auth.signUp };
  const secondaryAction = isAuthenticated
    ? { title: 'Library', route: APP_ROUTES.tabs.library }
    : { title: 'Sign In', route: APP_ROUTES.auth.signIn };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={theme.colors.background} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: isTablet ? 32 : 24 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                paddingTop: isTablet ? 52 : 40,
                gap: isTablet ? 28 : 22,
              }}
            >
              <View style={{ gap: isTablet ? 22 : 18 }}>
                <FadeIn>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Image source={BRAND_LOGO_ASSET} style={{ width: 24, height: 24, borderRadius: 8 }} />
                      </View>

                      <View>
                        <CustomText
                          variant="caption"
                          style={{
                            color: theme.colors.text.secondary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.9,
                          }}
                        >
                          ClaudyGod
                        </CustomText>
                        <CustomText variant="label" style={{ color: theme.colors.text.primary, marginTop: 2 }}>
                          Ministries
                        </CustomText>
                      </View>
                    </View>

                    {!isAuthenticated ? (
                      <AppButton
                        title="Sign In"
                        variant="secondary"
                        size="sm"
                        onPress={() => router.push(APP_ROUTES.auth.signIn)}
                      />
                    ) : null}
                  </View>
                </FadeIn>

                <FadeIn delay={70}>
                  <CinematicHeroCard
                    imageSource={BRAND_HERO_ASSET}
                    height={isTablet ? 480 : 368}
                    badge="ClaudyGod"
                    eyebrow="Stream the ministry"
                    title="Music, messages, and live worship in one clean experience."
                    subtitle="Designed for listening, watching, and returning without friction."
                    actions={[
                      {
                        label: primaryAction.title,
                        onPress: () => router.push(primaryAction.route),
                        icon: isAuthenticated ? 'play-arrow' : 'person-add',
                      },
                      {
                        label: secondaryAction.title,
                        onPress: () => router.push(secondaryAction.route),
                        variant: 'secondary',
                        icon: isAuthenticated ? 'library-music' : 'login',
                      },
                    ]}
                  />
                </FadeIn>

                <FadeIn delay={120}>
                  <View style={{ gap: 12 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                        Start from anywhere
                      </CustomText>
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.text.secondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        ClaudyGod app
                      </CustomText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {DESTINATIONS.map((destination) => (
                        <DestinationCard
                          key={destination.key}
                          icon={destination.icon}
                          label={destination.label}
                          onPress={() =>
                            router.push(isAuthenticated ? destination.route : APP_ROUTES.auth.signIn)
                          }
                        />
                      ))}
                    </View>
                  </View>
                </FadeIn>
              </View>

              <FadeIn delay={170}>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    paddingTop: 14,
                    paddingBottom: isTablet ? 6 : 2,
                    flexDirection: isTablet ? 'row' : 'column',
                    justifyContent: 'space-between',
                    alignItems: isTablet ? 'center' : 'flex-start',
                    gap: 12,
                    marginTop: 'auto',
                  }}
                >
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    Worship, teaching, and live ministry without the noise.
                  </CustomText>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TVTouchable
                      onPress={() => router.push(APP_ROUTES.auth.signUp)}
                      showFocusBorder={false}
                      style={{
                        minHeight: 34,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.primary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        Join
                      </CustomText>
                    </TVTouchable>
                    <TVTouchable
                      onPress={() => router.push(APP_ROUTES.tabs.videos)}
                      showFocusBorder={false}
                      style={{
                        minHeight: 34,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.text.primary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        Watch
                      </CustomText>
                    </TVTouchable>
                  </View>
                </View>
              </FadeIn>
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
