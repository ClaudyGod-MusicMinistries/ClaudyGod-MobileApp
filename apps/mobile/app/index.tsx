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

const LANDING_COLORS = {
  background: '#07080E',
  panel: 'rgba(12,15,18,0.94)',
  panelStrong: 'rgba(16,18,28,0.96)',
  border: 'rgba(255,255,255,0.09)',
  textPrimary: '#FFF9F0',
  textSecondary: 'rgba(196,203,210,0.78)',
  accent: '#CDB9FF',
  accentSoft: 'rgba(139,92,246,0.16)',
};

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
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: LANDING_COLORS.border,
        backgroundColor: LANDING_COLORS.panel,
        paddingHorizontal: 14,
        paddingVertical: 15,
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
          backgroundColor: LANDING_COLORS.accentSoft,
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.24)',
        }}
      >
        <MaterialIcons name={icon} size={18} color={LANDING_COLORS.accent} />
      </View>
      <CustomText variant="label" style={{ color: LANDING_COLORS.textPrimary }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const primaryAction = isAuthenticated
    ? { title: 'Continue', route: APP_ROUTES.tabs.home }
    : { title: 'Create Account', route: APP_ROUTES.auth.signUp };
  const secondaryAction = isAuthenticated
    ? { title: 'Library', route: APP_ROUTES.tabs.library }
    : { title: 'Sign In', route: APP_ROUTES.auth.signIn };

  return (
    <View style={{ flex: 1, backgroundColor: LANDING_COLORS.background }}>
      <StatusBar
        translucent={false}
        barStyle="light-content"
        backgroundColor={LANDING_COLORS.background}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: LANDING_COLORS.background }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: LANDING_COLORS.background }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: isTablet ? 32 : 24 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                paddingTop: isTablet ? 74 : 58,
                gap: isTablet ? 24 : 20,
              }}
            >
              <View style={{ gap: isTablet ? 24 : 20 }}>
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
                          borderColor: LANDING_COLORS.border,
                          backgroundColor: LANDING_COLORS.panel,
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
                            color: LANDING_COLORS.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.9,
                          }}
                        >
                          ClaudyGod
                        </CustomText>
                        <CustomText
                          variant="label"
                          style={{ color: LANDING_COLORS.textPrimary, marginTop: 2 }}
                        >
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
                        style={{
                          borderRadius: 12,
                          borderColor: LANDING_COLORS.border,
                          backgroundColor: LANDING_COLORS.panelStrong,
                        }}
                        textColor={LANDING_COLORS.textPrimary}
                      />
                    ) : null}
                  </View>
                </FadeIn>

                <FadeIn delay={70}>
                  <View style={{ paddingTop: isTablet ? 10 : 14 }}>
                    <CinematicHeroCard
                      imageSource={BRAND_HERO_ASSET}
                      height={isTablet ? 480 : 372}
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
                  </View>
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
                      <CustomText variant="heading" style={{ color: LANDING_COLORS.textPrimary }}>
                        Start from anywhere
                      </CustomText>
                      <CustomText
                        variant="caption"
                        style={{
                          color: LANDING_COLORS.textSecondary,
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
                    borderTopColor: LANDING_COLORS.border,
                    paddingTop: 16,
                    paddingBottom: isTablet ? 6 : 2,
                    flexDirection: isTablet ? 'row' : 'column',
                    justifyContent: 'space-between',
                    alignItems: isTablet ? 'center' : 'flex-start',
                    gap: 12,
                    marginTop: isTablet ? 'auto' : 8,
                  }}
                >
                  <CustomText variant="caption" style={{ color: LANDING_COLORS.textSecondary }}>
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
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: LANDING_COLORS.border,
                        backgroundColor: LANDING_COLORS.panelStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{
                          color: LANDING_COLORS.accent,
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        Join
                      </CustomText>
                    </TVTouchable>
                    <TVTouchable
                      onPress={() =>
                        router.push(isAuthenticated ? APP_ROUTES.tabs.videos : APP_ROUTES.auth.signIn)
                      }
                      showFocusBorder={false}
                      style={{
                        minHeight: 34,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: LANDING_COLORS.border,
                        backgroundColor: LANDING_COLORS.panelStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{
                          color: LANDING_COLORS.textPrimary,
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
