import React from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { FadeIn } from '../ui/FadeIn';
import { TVTouchable } from '../ui/TVTouchable';
import { AuthBrandPanel } from './AuthBrandPanel';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { useDeviceClass } from '../../util/deviceClassConfig';

interface AuthScreenFrameProps {
  backPath: string;
  salutation: string;
  description: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthScreenFrame({ backPath, salutation, description, title, subtitle, children }: AuthScreenFrameProps) {
  const router = useRouter();
  const device = useDeviceClass();
  const { width: screenWidth } = useWindowDimensions();
  const isPhone = device.isPhone;
  const showBrandPanel = device.prefersTwoPane;
  const shellWidth = device.isTV ? 1380 : device.isLargeDesktop ? 1220 : device.isDesktop ? 1140 : device.isTablet ? 760 : 500;
  const formWidth = device.isTV ? 560 : device.isDesktop ? 520 : shellWidth;

  const BackButton = (
    <TVTouchable
      onPress={() => router.replace(backPath)}
      style={{
        width: device.isTV ? 52 : 40,
        height: device.isTV ? 52 : 40,
        borderRadius: device.isTV ? 26 : 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name="arrow-back" size={device.isTV ? 24 : 20} color="#F7F2FF" />
    </TVTouchable>
  );

  // ── Phone: clean dark screen with scrollable form ──────────────────────────
  if (isPhone) {
    const maxFormWidth = Math.min(screenWidth, 400);

    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Top bar: back + logo */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 4,
          }}>
            {BackButton}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                backgroundColor: '#1A1A1A',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 18, height: 18, borderRadius: 5 }} />
              </View>
              <CustomText variant="label" style={{ color: '#F7F2FF', fontSize: 13, fontWeight: '700', letterSpacing: -0.1 }}>
                ClaudyGod
              </CustomText>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 28,
              maxWidth: maxFormWidth,
              width: '100%',
              alignSelf: 'center',
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <FadeIn delay={80} duration={320}>
              {/* Title */}
              <View style={{ marginBottom: 24 }}>
                <CustomText variant="display" style={{ color: '#F7F2FF', fontSize: 22, fontWeight: '700', letterSpacing: -0.5, lineHeight: 28 }}>
                  {title}
                </CustomText>
                <CustomText variant="body" style={{ color: '#9287AD', marginTop: 6, lineHeight: 19, fontSize: 13 }}>
                  {subtitle}
                </CustomText>
              </View>

              {/* Form card */}
              <View
                style={{
                  backgroundColor: '#111111',
                  borderRadius: 20,
                  padding: 20,
                }}
              >
                {children}
              </View>
            </FadeIn>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Tablet / Desktop / TV: two-pane or centered card ──────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar translucent={false} backgroundColor="#07050C" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: device.isTV ? 34 : 24,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Screen
            style={{ flex: 1 }}
            contentStyle={{ flex: 1, justifyContent: 'center', maxWidth: shellWidth }}
          >
            <FadeIn>
              <View>
                {BackButton}

                <View
                  style={{
                    marginTop: showBrandPanel ? 24 : 16,
                    width: '100%',
                    maxWidth: shellWidth,
                    alignSelf: 'center',
                    flexDirection: showBrandPanel ? 'row' : 'column',
                    alignItems: showBrandPanel ? 'stretch' : 'center',
                    gap: showBrandPanel ? 28 : 18,
                  }}
                >
                  {showBrandPanel ? (
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AuthBrandPanel salutation={salutation} description={description} />
                    </View>
                  ) : null}

                  {/* Form card */}
                  <View
                    style={{
                      width: '100%',
                      maxWidth: formWidth,
                      flex: showBrandPanel ? 0.82 : undefined,
                      borderRadius: device.isTablet ? 24 : 28,
                      backgroundColor: '#111111',
                      paddingHorizontal: device.isTV ? 32 : 26,
                      paddingVertical: device.isTV ? 32 : 26,
                    }}
                  >
                    {!showBrandPanel ? (
                      <AuthBrandPanel salutation={salutation} description={description} compact />
                    ) : null}

                    <CustomText
                      variant="display"
                      style={{
                        color: '#F7F2FF',
                        marginTop: 4,
                        fontSize: device.isTV ? 28 : device.isDesktop ? 22 : 20,
                        lineHeight: device.isTV ? 34 : device.isDesktop ? 28 : 26,
                        fontWeight: '700',
                        letterSpacing: -0.4,
                      }}
                    >
                      {title}
                    </CustomText>

                    <CustomText
                      variant="body"
                      style={{
                        color: '#9287AD',
                        marginTop: 6,
                        maxWidth: 460,
                        lineHeight: device.isTV ? 22 : 19,
                        fontSize: 13,
                      }}
                    >
                      {subtitle}
                    </CustomText>

                    <View style={{ marginTop: 22 }}>{children}</View>
                  </View>
                </View>
              </View>
            </FadeIn>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
