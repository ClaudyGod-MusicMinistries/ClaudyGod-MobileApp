import React from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { FadeIn } from '../components/ui/FadeIn';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { TVTouchable } from '../components/ui/TVTouchable';
import { useAppTheme } from '../util/colorScheme';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';

const FEATURES: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description: string;
}[] = [
  {
    icon: 'graphic-eq',
    title: 'Listen freely',
    description: 'Explore worship songs, messages, playlists, and recent releases.',
  },
  {
    icon: 'smart-display',
    title: 'Watch sessions',
    description: 'Enjoy ministry videos, replays, and visual worship moments.',
  },
  {
    icon: 'live-tv',
    title: 'Join live',
    description: 'Open live sessions and return to replays when they are available.',
  },
  {
    icon: 'person-add-alt',
    title: 'Create later',
    description: 'Start now as a guest, then sign in whenever you want saved access.',
  },
];

export default function GuestWelcomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWide = width >= 1024;
  const isCompact = width < 380;
  const cardWidth = isWide ? '23.8%' : isTablet ? '48.5%' : '100%';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={theme.colors.background} />
      <LinearGradient
        colors={theme.scheme === 'dark' ? ['#130B24', '#07040D', '#05030A'] : ['#F8F5FF', '#F1ECFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: isTablet ? theme.spacing.xxl : theme.spacing.lg,
              paddingVertical: isTablet ? theme.spacing.xxl : theme.spacing.lg,
              justifyContent: 'center',
            }}
          >
            <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center', gap: theme.spacing.xl }}>
              <FadeIn>
                <SurfaceCard tone="strong" style={{ padding: isTablet ? theme.spacing.xxl : theme.spacing.xl }}>
                  <View style={{ flexDirection: isWide ? 'row' : 'column', gap: theme.spacing.xl, alignItems: isWide ? 'center' : 'flex-start' }}>
                    <View style={{ flex: 1, gap: theme.spacing.lg }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(183,148,246,0.16)', borderWidth: 1, borderColor: 'rgba(183,148,246,0.28)', alignItems: 'center', justifyContent: 'center' }}>
                          <Image source={BRAND_LOGO_ASSET} style={{ width: 30, height: 30, borderRadius: 10 }} />
                        </View>
                        <View>
                          <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                            Guest mode
                          </CustomText>
                          <CustomText variant="label" style={{ color: theme.colors.text, marginTop: 2 }}>
                            ClaudyGod Ministries
                          </CustomText>
                        </View>
                      </View>

                      <View style={{ gap: 10 }}>
                        <CustomText variant="hero" style={{ color: theme.colors.text, fontSize: isCompact ? 28 : isTablet ? 46 : 34, lineHeight: isCompact ? 34 : isTablet ? 54 : 42, letterSpacing: -1.1 }}>
                          Start listening without friction.
                        </CustomText>
                        <CustomText variant="body" style={{ color: theme.colors.textSecondary, maxWidth: 560, fontSize: isTablet ? 15 : 13.5, lineHeight: isTablet ? 23 : 20 }}>
                          Browse worship music, videos, live sessions, and playlists now. Sign in later when you want to keep your library across devices.
                        </CustomText>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <AppButton
                          title="Enter app"
                          size={isCompact ? 'md' : 'lg'}
                          onPress={() => router.replace(APP_ROUTES.tabs.home)}
                          leftIcon={<MaterialIcons name="arrow-forward" size={18} color={theme.colors.textInverse} />}
                          style={{ minWidth: isCompact ? '100%' : 160 }}
                        />
                        <AppButton
                          title="Create account"
                          variant="secondary"
                          size={isCompact ? 'md' : 'lg'}
                          onPress={() => router.replace(APP_ROUTES.auth.signUp)}
                          leftIcon={<MaterialIcons name="person-add-alt" size={18} color={theme.colors.text} />}
                          style={{ minWidth: isCompact ? '100%' : 180 }}
                        />
                      </View>
                    </View>

                    <View style={{ width: isWide ? 340 : '100%', gap: 12 }}>
                      {['Music', 'Videos', 'Live', 'Library'].map((label, index) => (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: theme.radius.xl, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 14 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(183,148,246,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                            <CustomText variant="label" style={{ color: theme.colors.primary }}>{index + 1}</CustomText>
                          </View>
                          <CustomText variant="label" style={{ flex: 1, color: '#FFFFFF' }}>{label}</CustomText>
                          <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.58)" />
                        </View>
                      ))}
                    </View>
                  </View>
                </SurfaceCard>
              </FadeIn>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {FEATURES.map((feature, index) => (
                  <FadeIn key={feature.title} delay={90 + index * 30}>
                    <SurfaceCard tone="subtle" style={{ width: cardWidth, minWidth: isTablet ? 220 : undefined, padding: theme.spacing.md }}>
                      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name={feature.icon} size={20} color={theme.colors.primary} />
                      </View>
                      <CustomText variant="label" style={{ color: theme.colors.text, marginTop: 12 }}>{feature.title}</CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 5, lineHeight: 16 }}>{feature.description}</CustomText>
                    </SurfaceCard>
                  </FadeIn>
                ))}
              </View>

              <TVTouchable onPress={() => router.replace(APP_ROUTES.landing)} showFocusBorder={false} style={{ alignSelf: 'center', padding: 10 }}>
                <CustomText variant="label" style={{ color: theme.colors.textSecondary }}>
                  Back to welcome
                </CustomText>
              </TVTouchable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
