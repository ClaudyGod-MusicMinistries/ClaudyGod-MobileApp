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
  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(17,22,27,0.88)',
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
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(210,176,105,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(210,176,105,0.18)',
        }}
      >
        <MaterialIcons name={icon} size={18} color="#DFC07E" />
      </View>
      <CustomText variant="label" style={{ color: '#F4F0E7' }}>
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
    <View style={{ flex: 1, backgroundColor: '#07090C' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#07090C" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Screen>
            <View style={{ paddingTop: 10, gap: 24 }}>
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
                        borderColor: 'rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
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
                          color: 'rgba(223,213,193,0.7)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        ClaudyGod
                      </CustomText>
                      <CustomText variant="label" style={{ color: '#F7F3EA', marginTop: 2 }}>
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
                  height={isTablet ? 430 : 360}
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
                    <CustomText variant="heading" style={{ color: '#F3EEE5' }}>
                      Start from anywhere
                    </CustomText>
                    <CustomText
                      variant="caption"
                      style={{
                        color: 'rgba(205,198,186,0.62)',
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

              <FadeIn delay={170}>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.08)',
                    paddingTop: 16,
                    flexDirection: isTablet ? 'row' : 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <CustomText variant="caption" style={{ color: 'rgba(200,194,184,0.62)' }}>
                    Worship, teaching, and live ministry without the noise.
                  </CustomText>

                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signUp)} showFocusBorder={false}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: '#D8C08A',
                          textTransform: 'uppercase',
                          letterSpacing: 0.9,
                        }}
                      >
                        Join
                      </CustomText>
                    </TVTouchable>
                    <TVTouchable onPress={() => router.push(APP_ROUTES.tabs.videos)} showFocusBorder={false}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: 'rgba(228,221,209,0.76)',
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
