import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import { useAppTheme } from '../util/colorScheme';

export default function LandingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isDesktop = width >= 1024 && !isTV;
  const isTablet = width >= 768 && width < 1024 && !isTV;
  const compact = width < 390;
  const smallPhone = width < 440;
  const shortViewport = height < 720;

  const shellMaxWidth = isDesktop ? 1180 : isTablet ? 620 : 520;
  const horizontalPadding = compact ? 16 : isDesktop ? 52 : 22;
  const verticalPadding = isDesktop ? 46 : shortViewport ? 18 : 28;
  const logoSize = isDesktop ? 68 : compact ? 50 : 56;

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <ImageBackground
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        imageStyle={{ opacity: isDesktop ? 0.24 : 0.34 }}
        style={{ flex: 1, backgroundColor: '#08050F' }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(8,5,15,0.62)',
            'rgba(8,5,15,0.88)',
            'rgba(8,5,15,0.98)',
          ]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <View
          style={{
            flex: 1,
            width: '100%',
            justifyContent: 'center',
            paddingHorizontal: horizontalPadding,
            paddingVertical: verticalPadding,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: shellMaxWidth,
              alignSelf: 'center',
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isDesktop ? 46 : 18,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: isDesktop ? 560 : 520,
                flex: isDesktop ? 0.95 : undefined,
                alignItems: isDesktop ? 'flex-start' : 'center',
              }}
            >
              <View
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: isDesktop ? 24 : 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.22)',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 10 },
                }}
              >
                <Image
                  source={BRAND_LOGO_ASSET}
                  resizeMode="cover"
                  style={{
                    width: isDesktop ? 44 : 36,
                    height: isDesktop ? 44 : 36,
                    borderRadius: isDesktop ? 15 : 12,
                  }}
                />
              </View>

              <View
                style={{
                  marginTop: isDesktop ? 22 : 14,
                  alignSelf: isDesktop ? 'flex-start' : 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.16)',
                  backgroundColor: 'rgba(255,255,255,0.075)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <CustomText
                  variant="caption"
                  style={{
                    color: 'rgba(255,255,255,0.78)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.72,
                    textAlign: 'center',
                  }}
                >
                  ClaudyGod worship experience
                </CustomText>
              </View>

              <CustomText
                variant="display"
                style={{
                  color: '#FFFFFF',
                  marginTop: isDesktop ? 18 : 14,
                  fontSize: isDesktop ? 54 : isTablet ? 40 : compact ? 29 : 32,
                  lineHeight: isDesktop ? 60 : isTablet ? 46 : compact ? 35 : 38,
                  letterSpacing: isDesktop ? -1.7 : -0.8,
                  textAlign: isDesktop ? 'left' : 'center',
                  maxWidth: isDesktop ? 560 : 430,
                }}
              >
                Music, videos, and live worship in one place.
              </CustomText>

              <CustomText
                variant="body"
                style={{
                  color: 'rgba(255,255,255,0.80)',
                  marginTop: 10,
                  lineHeight: isDesktop ? 24 : 21,
                  fontSize: isDesktop ? 15 : undefined,
                  maxWidth: isDesktop ? 520 : 410,
                  textAlign: isDesktop ? 'left' : 'center',
                }}
              >
                Browse public releases as a guest, or sign in to keep your library, history, alerts, and profile synced.
              </CustomText>

              <SurfaceCard
                tone="strong"
                style={{
                  marginTop: isDesktop ? 22 : 16,
                  padding: isDesktop ? 18 : 13,
                  gap: 10,
                  backgroundColor: 'rgba(11,9,20,0.92)',
                  borderColor: 'rgba(255,255,255,0.13)',
                  maxWidth: 520,
                  width: '100%',
                  alignSelf: isDesktop ? 'flex-start' : 'center',
                }}
              >
                <AppButton
                  title="Continue as guest"
                  size="lg"
                  fullWidth
                  onPress={() => router.replace(APP_ROUTES.tabs.home)}
                  leftIcon={<MaterialIcons name="person-outline" size={18} color={theme.colors.textInverse} />}
                />

                <View style={{ flexDirection: smallPhone ? 'column' : 'row', gap: 10 }}>
                  <AppButton
                    title="Sign in"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.auth.signIn)}
                    leftIcon={<MaterialIcons name="login" size={18} color="#FFFFFF" />}
                    textColor="#FFFFFF"
                    style={{
                      flex: smallPhone ? undefined : 1,
                      backgroundColor: 'rgba(255,255,255,0.105)',
                      borderColor: 'rgba(255,255,255,0.16)',
                    }}
                  />
                  <AppButton
                    title="Create account"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.auth.signUp)}
                    leftIcon={<MaterialIcons name="person-add-alt" size={18} color="#FFFFFF" />}
                    textColor="#FFFFFF"
                    style={{
                      flex: smallPhone ? undefined : 1,
                      backgroundColor: 'rgba(255,255,255,0.105)',
                      borderColor: 'rgba(255,255,255,0.16)',
                    }}
                  />
                </View>

                <CustomText
                  variant="caption"
                  style={{
                    color: 'rgba(255,255,255,0.68)',
                    textAlign: 'center',
                    lineHeight: 17,
                  }}
                >
                  Guest mode is limited to public listening and viewing. Personal features require an account.
                </CustomText>
              </SurfaceCard>
            </View>

            {isDesktop ? (
              <View
                style={{
                  flex: 1.05,
                  minHeight: 560,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: '100%',
                    maxWidth: 430,
                    aspectRatio: 0.58,
                    borderRadius: 46,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.16)',
                    backgroundColor: '#120D20',
                    shadowColor: '#000',
                    shadowOpacity: 0.34,
                    shadowRadius: 36,
                    shadowOffset: { width: 0, height: 22 },
                  }}
                >
                  <Image
                    source={LANDING_BG_ASSET}
                    resizeMode="cover"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                    }}
                  />
                  <LinearGradient
                    colors={[
                      'rgba(8,5,15,0.08)',
                      'rgba(8,5,15,0.22)',
                      'rgba(8,5,15,0.82)',
                    ]}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      justifyContent: 'flex-end',
                      padding: 24,
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.18)',
                        backgroundColor: 'rgba(0,0,0,0.42)',
                        padding: 16,
                      }}
                    >
                      <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.68)', textTransform: 'uppercase', letterSpacing: 0.72 }}>
                        Ready for worship
                      </CustomText>
                      <CustomText variant="title" style={{ color: '#FFFFFF', marginTop: 6 }}>
                        Stream music, video, and live moments without leaving the app.
                      </CustomText>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
