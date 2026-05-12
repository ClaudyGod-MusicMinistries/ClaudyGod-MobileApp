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
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';

const valueCards = [
  { icon: 'graphic-eq' as const, label: 'Music', text: 'Listen to published worship and audio releases.' },
  { icon: 'smart-display' as const, label: 'Videos', text: 'Watch sessions, clips, and replays from the ministry.' },
  { icon: 'live-tv' as const, label: 'Live', text: 'Follow live sessions and upcoming broadcasts.' },
];

export default function LandingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const isWide = width >= 820;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={theme.colors.background} />
      <ImageBackground source={LANDING_BG_ASSET} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(5,4,10,0.72)', 'rgba(5,4,10,0.88)', theme.colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
              <Screen>
                <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap }}>
                  <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Image source={BRAND_LOGO_ASSET} style={{ width: 38, height: 38, borderRadius: 14 }} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
                            ClaudyGod
                          </CustomText>
                          <CustomText variant="caption" style={{ color: theme.colors.textSecondary }} numberOfLines={1}>
                            Music Ministries
                          </CustomText>
                        </View>
                      </View>
                      <AppButton title="Sign in" variant="secondary" size="sm" onPress={() => router.push(APP_ROUTES.auth.signIn)} />
                    </View>
                  </SurfaceCard>

                  <SurfaceCard tone="strong" style={{ overflow: 'hidden' }}>
                    <LinearGradient
                      colors={['rgba(141,99,255,0.26)', 'rgba(10,7,18,0.08)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: compact ? theme.spacing.lg : theme.spacing.xl }}
                    >
                      <View style={{ maxWidth: isWide ? 620 : undefined, gap: 12 }}>
                        <View
                          style={{
                            alignSelf: 'flex-start',
                            borderRadius: theme.radius.pill,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.18)',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          }}
                        >
                          <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}>
                            Worship app
                          </CustomText>
                        </View>

                        <CustomText variant="display" style={{ color: '#FFFFFF' }} numberOfLines={3}>
                          Music, messages, video, and live ministry in one calm space.
                        </CustomText>

                        <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.76)', maxWidth: 560 }}>
                          Sign in to save your library, follow live updates, and personalize your ClaudyGod experience.
                        </CustomText>

                        <View style={{ flexDirection: compact ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                          <AppButton
                            title="Create account"
                            size="md"
                            onPress={() => router.push(APP_ROUTES.auth.signUp)}
                            leftIcon={<MaterialIcons name="person-add-alt" size={17} color={theme.colors.textInverse} />}
                            fullWidth={compact}
                          />
                          <AppButton
                            title="Guest preview"
                            variant="secondary"
                            size="md"
                            onPress={() => router.push('/guest-welcome' as never)}
                            leftIcon={<MaterialIcons name="visibility" size={17} color={theme.colors.text} />}
                            fullWidth={compact}
                          />
                        </View>
                      </View>
                    </LinearGradient>
                  </SurfaceCard>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {valueCards.map((card) => (
                      <SurfaceCard key={card.label} tone="subtle" style={{ width: compact ? '100%' : '31.5%', minWidth: compact ? undefined : 190, flexGrow: 1, padding: theme.spacing.md }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(183,148,246,0.12)' }}>
                          <MaterialIcons name={card.icon} size={17} color={theme.colors.primary} />
                        </View>
                        <CustomText variant="label" style={{ color: theme.colors.text, marginTop: 10 }}>
                          {card.label}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
                          {card.text}
                        </CustomText>
                      </SurfaceCard>
                    ))}
                  </View>

                  <AppScreenFooter compact />
                </View>
              </Screen>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
