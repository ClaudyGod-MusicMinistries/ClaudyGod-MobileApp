import React from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { FadeIn } from '../ui/FadeIn';
import { TVTouchable } from '../ui/TVTouchable';
import { AuthBrandPanel } from './AuthBrandPanel';
import { BRAND_LOGO_ASSET, BRAND_WORSHIP_ASSET } from '../../util/brandAssets';
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
  const { height: screenHeight } = useWindowDimensions();
  const isPhone = device.isPhone;
  const showBrandPanel = device.prefersTwoPane;
  const shellWidth = device.isTV ? 1380 : device.isLargeDesktop ? 1220 : device.isDesktop ? 1140 : device.isTablet ? 760 : 500;
  const formWidth = device.isTV ? 560 : device.isDesktop ? 520 : shellWidth;

  // ── Phone: Cinematic hero + bottom-sheet form ──────────────────────────────
  if (isPhone) {
    const heroHeight = Math.min(Math.round(screenHeight * 0.42), 360);

    return (
      <View style={{ flex: 1, backgroundColor: '#06030D' }}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* ── Hero image section ── */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: heroHeight + 40 }}>
          <Image
            source={BRAND_WORSHIP_ASSET}
            resizeMode="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          />
          {/* Vignette gradient top → transparent */}
          <LinearGradient
            colors={['rgba(6,3,13,0.62)', 'rgba(6,3,13,0.08)', 'rgba(6,3,13,0.00)']}
            locations={[0, 0.38, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: heroHeight * 0.5 }}
          />
          {/* Strong fade into bottom (transitions into card) */}
          <LinearGradient
            colors={['rgba(6,3,13,0.00)', 'rgba(6,3,13,0.78)', 'rgba(6,3,13,1.00)']}
            locations={[0, 0.62, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heroHeight * 0.72 }}
          />
          {/* Purple tint overlay */}
          <LinearGradient
            colors={['rgba(124,58,237,0.18)', 'rgba(6,3,13,0.00)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.5, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>

        {/* ── Back button + brand logo (floating over image) ── */}
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 }}>
            <TVTouchable
              onPress={() => router.replace(backPath)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                backgroundColor: 'rgba(6,3,13,0.52)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            </TVTouchable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  borderWidth: 1,
                  borderColor: 'rgba(183,148,246,0.36)',
                  backgroundColor: 'rgba(183,148,246,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: 20, height: 20, borderRadius: 6 }} />
              </View>
              <CustomText variant="label" style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '700', letterSpacing: -0.2 }}>
                ClaudyGod
              </CustomText>
            </View>
          </View>
        </SafeAreaView>

        {/* ── Scrollable form content (overlaps image at bottom) ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: heroHeight - 30,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeIn delay={120} duration={380}>
            <View
              style={{
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: 'rgba(183,148,246,0.18)',
                backgroundColor: 'rgba(10,6,20,0.98)',
                paddingHorizontal: 22,
                paddingTop: 26,
                paddingBottom: 36,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -12 },
                shadowOpacity: 0.38,
                shadowRadius: 28,
                elevation: 20,
              }}
            >
              {/* ── Hero text inside card ── */}
              <View style={{ marginBottom: 22 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(183,148,246,0.30)',
                    backgroundColor: 'rgba(183,148,246,0.10)',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    marginBottom: 12,
                  }}
                >
                  <CustomText variant="caption" style={{ color: '#C7A8FF', textTransform: 'uppercase', letterSpacing: 0.9, fontSize: 10, fontWeight: '700' }}>
                    Secure access
                  </CustomText>
                </View>

                <CustomText variant="display" style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34 }}>
                  {title}
                </CustomText>
                <CustomText variant="body" style={{ color: 'rgba(210,198,240,0.76)', marginTop: 7, lineHeight: 21, fontSize: 14 }}>
                  {subtitle}
                </CustomText>
              </View>

              {children}
            </View>
          </FadeIn>
        </ScrollView>
      </View>
    );
  }

  // ── Tablet / Desktop / TV: Two-pane or centered glass card ────────────────

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <Image
        source={BRAND_WORSHIP_ASSET}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: showBrandPanel ? 0.20 : 0.22 }}
      />
      <LinearGradient
        colors={['rgba(8,5,15,0.52)', 'rgba(8,5,15,0.84)', '#08050F']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <StatusBar translucent={false} backgroundColor="#08050F" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: device.isTV ? 34 : 24,
            paddingBottom: device.isTV ? 34 : 28,
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
                <TVTouchable
                  onPress={() => router.replace(backPath)}
                  style={{
                    width: device.isTV ? 54 : 42,
                    height: device.isTV ? 54 : 42,
                    borderRadius: device.isTV ? 27 : 21,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={device.isTV ? 26 : 21} color="#FFFFFF" />
                </TVTouchable>

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

                  <View
                    style={{
                      width: '100%',
                      maxWidth: formWidth,
                      flex: showBrandPanel ? 0.82 : undefined,
                      borderRadius: device.isTablet ? 28 : 30,
                      borderWidth: 1,
                      borderColor: 'rgba(183,148,246,0.18)',
                      backgroundColor: 'rgba(14,9,26,0.96)',
                      paddingHorizontal: device.isTV ? 32 : 26,
                      paddingVertical: device.isTV ? 32 : 26,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 18 },
                      shadowOpacity: 0.28,
                      shadowRadius: 36,
                      elevation: 14,
                    }}
                  >
                    {!showBrandPanel ? <AuthBrandPanel salutation={salutation} description={description} compact /> : null}

                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(183,148,246,0.28)',
                        backgroundColor: 'rgba(183,148,246,0.10)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <CustomText variant="caption" style={{ color: '#C7A8FF', textTransform: 'uppercase', letterSpacing: 0.86, fontSize: 10, fontWeight: '700' }}>
                        Secure access
                      </CustomText>
                    </View>

                    <CustomText
                      variant="display"
                      style={{
                        color: '#FFFFFF',
                        marginTop: 14,
                        fontSize: device.isTV ? 38 : device.isDesktop ? 32 : undefined,
                        lineHeight: device.isTV ? 46 : device.isDesktop ? 38 : undefined,
                        fontWeight: '800',
                        letterSpacing: -0.5,
                      }}
                    >
                      {title}
                    </CustomText>

                    <CustomText
                      variant="body"
                      style={{
                        color: 'rgba(210,198,240,0.76)',
                        marginTop: 8,
                        maxWidth: 460,
                        lineHeight: device.isTV ? 25 : 22,
                        fontSize: device.isTV ? 15.5 : undefined,
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
