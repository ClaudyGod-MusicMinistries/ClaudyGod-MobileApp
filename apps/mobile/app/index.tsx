import React from 'react';
import { Image, ImageBackground, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppButton } from '../components/ui/AppButton';
import { AppScreenFooter } from '../components/layout/AppScreenFooter';
import { CustomText } from '../components/CustomText';
import { Screen } from '../components/layout/Screen';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';

const experienceCards = [
  {
    icon: 'graphic-eq' as const,
    label: 'Music',
    text: 'Published worship and audio releases in one clean listening space.',
  },
  {
    icon: 'smart-display' as const,
    label: 'Videos',
    text: 'Messages, sessions, clips, and replays arranged for easy viewing.',
  },
  {
    icon: 'live-tv' as const,
    label: 'Live',
    text: 'Follow live ministry moments and upcoming broadcasts without confusion.',
  },
];

export default function LandingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 430;
  const isWide = width >= 820;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={theme.colors.background} />
      <ImageBackground source={LANDING_BG_ASSET} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient
          colors={
            theme.scheme === 'dark'
              ? ['rgba(7,5,12,0.72)', 'rgba(7,5,12,0.92)', theme.colors.background]
              : ['rgba(25,16,45,0.34)', 'rgba(243,239,248,0.88)', theme.colors.background]
          }
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                minHeight: height,
                paddingBottom: 26,
              }}
            >
              <Screen>
                <View style={{ minHeight: height - 34, paddingTop: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <Image
                        source={BRAND_LOGO_ASSET}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 13,
                          backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                        }}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <CustomText variant="label" style={{ color: '#FFFFFF' }} numberOfLines={1}>
                          ClaudyGod
                        </CustomText>
                        <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.68)' }} numberOfLines={1}>
                          Music Ministries
                        </CustomText>
                      </View>
                    </View>

                    <AppButton
                      title="Sign in"
                      variant="secondary"
                      size="sm"
                      onPress={() => router.push(APP_ROUTES.auth.signIn)}
                      textColor="#FFFFFF"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderColor: 'rgba(255,255,255,0.14)',
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      paddingTop: compact ? 26 : 46,
                      paddingBottom: compact ? 28 : 46,
                    }}
                  >
                    <View
                      style={{
                        maxWidth: isWide ? 640 : undefined,
                        gap: 18,
                      }}
                    >
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          borderRadius: theme.radius.pill,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.16)',
                          backgroundColor: 'rgba(255,255,255,0.07)',
                          paddingHorizontal: 11,
                          paddingVertical: 7,
                        }}
                      >
                        <CustomText
                          variant="caption"
                          style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}
                        >
                          Worship app
                        </CustomText>
                      </View>

                      <CustomText
                        variant="heading"
                        style={{
                          color: '#FFFFFF',
                          fontSize: compact ? 23 : 27,
                          lineHeight: compact ? 31 : 35,
                          letterSpacing: -0.55,
                          maxWidth: 560,
                        }}
                      >
                        Worship, messages, video, and live ministry in one calm app.
                      </CustomText>

                      <CustomText
                        variant="body"
                        style={{
                          color: 'rgba(255,255,255,0.74)',
                          maxWidth: 520,
                          lineHeight: 20,
                        }}
                      >
                        Sign in to save your library, follow live updates, and personalize your ClaudyGod experience across music, videos, and live sessions.
                      </CustomText>

                      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 10, marginTop: 4 }}>
                        <AppButton
                          title="Create account"
                          size="md"
                          onPress={() => router.push(APP_ROUTES.auth.signUp)}
                          leftIcon={<MaterialIcons name="person-add" size={16} color={theme.colors.textInverse} />}
                          fullWidth={compact}
                        />
                        <AppButton
                          title="Guest preview"
                          variant="secondary"
                          size="md"
                          onPress={() => router.push('/guest-welcome' as never)}
                          leftIcon={<MaterialIcons name="visibility" size={16} color="#FFFFFF" />}
                          textColor="#FFFFFF"
                          fullWidth={compact}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.07)',
                            borderColor: 'rgba(255,255,255,0.14)',
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <CustomText variant="label" style={{ color: '#FFFFFF' }}>
                          What you can access
                        </CustomText>
                        <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.62)', marginTop: 3 }}>
                          A clean path into the ministry experience.
                        </CustomText>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {experienceCards.map((card) => (
                        <TVTouchable
                          key={card.label}
                          onPress={() => router.push('/guest-welcome' as never)}
                          showFocusBorder={false}
                          style={{ width: compact ? '100%' : '31.5%', minWidth: compact ? undefined : 190, flexGrow: 1 }}
                        >
                          <SurfaceCard
                            tone="subtle"
                            style={{
                              minHeight: 124,
                              padding: theme.spacing.md,
                              backgroundColor: theme.scheme === 'dark' ? 'rgba(17,11,28,0.78)' : 'rgba(252,250,255,0.74)',
                              borderColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.42)',
                            }}
                          >
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 17,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
                              }}
                            >
                              <MaterialIcons name={card.icon} size={17} color={theme.colors.primary} />
                            </View>
                            <CustomText variant="label" style={{ color: theme.colors.text, marginTop: 12 }}>
                              {card.label}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                              {card.text}
                            </CustomText>
                          </SurfaceCard>
                        </TVTouchable>
                      ))}
                    </View>
                  </View>

                  <AppScreenFooter variant="landing" />
                </View>
              </Screen>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
