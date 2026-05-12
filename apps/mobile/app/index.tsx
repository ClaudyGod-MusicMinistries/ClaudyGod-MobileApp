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
import { TVTouchable } from '../components/ui/TVTouchable';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';

const experienceCards = [
  {
    icon: 'graphic-eq' as const,
    label: 'Music',
    text: 'Listen to published worship and audio releases.',
  },
  {
    icon: 'smart-display' as const,
    label: 'Videos',
    text: 'Watch ministry sessions, clips, and replays.',
  },
  {
    icon: 'live-tv' as const,
    label: 'Live',
    text: 'Follow live sessions and upcoming broadcasts.',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 430;
  const isWide = width >= 820;

  return (
    <View style={{ flex: 1, backgroundColor: '#040308' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#040308" />
      <ImageBackground source={LANDING_BG_ASSET} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(4,3,8,0.88)', 'rgba(4,3,8,0.96)', '#040308']}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                minHeight: height,
                flexGrow: 1,
                paddingBottom: 20,
              }}
            >
              <Screen>
                <View style={{ minHeight: height - 26, paddingTop: 10, paddingBottom: 8 }}>
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
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.055)',
                        }}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <CustomText variant="label" style={{ color: '#F4EEFF', fontSize: 11.5, lineHeight: 15 }} numberOfLines={1}>
                          ClaudyGod
                        </CustomText>
                        <CustomText variant="caption" style={{ color: 'rgba(184,175,203,0.72)', fontSize: 10, lineHeight: 13 }} numberOfLines={1}>
                          Music Ministries
                        </CustomText>
                      </View>
                    </View>

                    <AppButton
                      title="Sign in"
                      variant="secondary"
                      size="sm"
                      onPress={() => router.push(APP_ROUTES.auth.signIn)}
                      textColor="#F4EEFF"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.055)',
                        borderColor: 'rgba(185,148,255,0.13)',
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      paddingTop: compact ? 34 : 54,
                      paddingBottom: compact ? 38 : 60,
                    }}
                  >
                    <View style={{ maxWidth: isWide ? 620 : undefined, gap: compact ? 15 : 17 }}>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(185,148,255,0.24)',
                          backgroundColor: 'rgba(7,4,12,0.76)',
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                        }}
                      >
                        <CustomText
                          variant="caption"
                          style={{
                            color: '#F4EEFF',
                            textTransform: 'uppercase',
                            letterSpacing: 0.75,
                            fontSize: 10.5,
                            lineHeight: 13,
                          }}
                        >
                          Worship app
                        </CustomText>
                      </View>

                      <CustomText
                        variant="heading"
                        style={{
                          color: '#FFFFFF',
                          fontSize: compact ? 22 : 25,
                          lineHeight: compact ? 29 : 33,
                          letterSpacing: -0.48,
                          maxWidth: 540,
                        }}
                      >
                        Music, messages, video, and live ministry in one calm space.
                      </CustomText>

                      <CustomText
                        variant="body"
                        style={{
                          color: 'rgba(216,207,232,0.78)',
                          maxWidth: 510,
                          fontSize: 12.2,
                          lineHeight: 19,
                        }}
                      >
                        Sign in to save your library, follow live updates, and personalize your ClaudyGod experience.
                      </CustomText>

                      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 10, marginTop: 4 }}>
                        <AppButton
                          title="Create account"
                          size="md"
                          onPress={() => router.push(APP_ROUTES.auth.signUp)}
                          leftIcon={<MaterialIcons name="person-add" size={15} color="#130A22" />}
                          fullWidth={compact}
                        />
                        <AppButton
                          title="Guest preview"
                          variant="secondary"
                          size="md"
                          onPress={() => router.push('/guest-welcome' as never)}
                          leftIcon={<MaterialIcons name="visibility" size={15} color="#F4EEFF" />}
                          textColor="#F4EEFF"
                          fullWidth={compact}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.055)',
                            borderColor: 'rgba(185,148,255,0.13)',
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 12, paddingBottom: 28 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <CustomText variant="label" style={{ color: '#F4EEFF', fontSize: 11.4, lineHeight: 15 }}>
                          Start with what matters
                        </CustomText>
                        <CustomText variant="caption" style={{ color: 'rgba(184,175,203,0.66)', marginTop: 3, fontSize: 10.2, lineHeight: 14 }}>
                          A simple entry into the ministry experience.
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
                          <View
                            style={{
                              minHeight: compact ? 88 : 104,
                              padding: 14,
                              borderRadius: 18,
                              borderWidth: 1,
                              borderColor: 'rgba(185,148,255,0.11)',
                              backgroundColor: 'rgba(13,8,22,0.72)',
                            }}
                          >
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(185,148,255,0.11)',
                              }}
                            >
                              <MaterialIcons name={card.icon} size={16} color="#B994FF" />
                            </View>
                            <CustomText variant="label" style={{ color: '#F4EEFF', marginTop: 11, fontSize: 11.5, lineHeight: 15 }}>
                              {card.label}
                            </CustomText>
                            <CustomText variant="caption" style={{ color: 'rgba(184,175,203,0.70)', marginTop: 4, fontSize: 10.2, lineHeight: 14 }}>
                              {card.text}
                            </CustomText>
                          </View>
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
