import React from 'react';
import { Platform, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { FadeIn } from '../ui/FadeIn';
import { TVTouchable } from '../ui/TVTouchable';
import { AuthBrandPanel } from './AuthBrandPanel';

interface AuthScreenFrameProps {
  backPath: string;
  salutation: string;
  description: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthScreenFrame({
  backPath,
  salutation,
  description,
  title,
  subtitle,
  children,
}: AuthScreenFrameProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && !isTV;
  const isDesktop = width >= 1040 && !isTV;
  const isPhone = !isTablet && !isTV;
  const compact = width < 370;
  const compactViewport = height < 760;
  const narrow = width < 430;
  const shellWidth = isDesktop ? 1080 : isTablet ? 760 : 440;

  return (
    <View style={{ flex: 1, backgroundColor: '#07050F' }}>
      <StatusBar translucent={false} backgroundColor="#07050F" barStyle="light-content" />

      <LinearGradient
        colors={['rgba(154,107,255,0.30)', 'rgba(15,10,29,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          position: 'absolute',
          left: -44,
          top: -34,
          width: isTablet ? 420 : 320,
          height: isTablet ? 420 : 320,
          borderRadius: 420,
        }}
      />
      <LinearGradient
        colors={['rgba(67,183,255,0.16)', 'rgba(8,7,13,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          right: -80,
          bottom: -70,
          width: isDesktop ? 520 : 360,
          height: isDesktop ? 520 : 360,
          borderRadius: 999,
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: isWeb ? 0 : 24,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          scrollEnabled={!isWeb || compactViewport}
          keyboardShouldPersistTaps="handled"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1, justifyContent: 'center' }}>
            <FadeIn>
              <View style={{ paddingTop: isPhone ? 2 : compactViewport ? 4 : 10 }}>
                <TVTouchable
                  onPress={() => router.replace(backPath)}
                  style={{
                    width: isPhone ? 38 : 40,
                    height: isPhone ? 38 : 40,
                    borderRadius: isPhone ? 13 : 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={22} color="#F8F7FC" />
                </TVTouchable>

                <View
                  style={{
                    marginTop: isPhone ? 12 : compactViewport ? 12 : 16,
                    width: '100%',
                    maxWidth: shellWidth,
                    alignSelf: 'center',
                    borderRadius: isDesktop ? 30 : 24,
                    padding: isDesktop ? 20 : isTablet ? 8 : 0,
                    backgroundColor: isDesktop || isTablet ? 'rgba(12,10,22,0.82)' : 'transparent',
                    borderWidth: 1,
                    borderColor: isDesktop || isTablet ? 'rgba(235,226,255,0.10)' : 'transparent',
                    flexDirection: isDesktop ? 'row' : 'column',
                    gap: isDesktop ? 18 : 0,
                  }}
                >
                  {isDesktop ? (
                    <View style={{ flex: 0.95, justifyContent: 'center' }}>
                      <AuthBrandPanel salutation={salutation} description={description} />
                    </View>
                  ) : null}

                  <View
                    style={{
                      flex: 1,
                      borderRadius: isPhone ? 26 : 24,
                      padding: isDesktop
                        ? 24
                        : isTablet
                          ? 22
                          : compactViewport
                            ? 18
                            : compact
                              ? 18
                              : 20,
                      backgroundColor: isPhone ? 'rgba(11,9,18,0.96)' : 'rgba(13,10,22,0.90)',
                      borderWidth: 1,
                      borderColor: 'rgba(235,226,255,0.12)',
                    }}
                  >
                    {isPhone ? (
                      <AuthBrandPanel salutation={salutation} description={description} compact />
                    ) : !isDesktop ? (
                      <AuthBrandPanel salutation={salutation} description={description} />
                    ) : null}

                    {!isPhone ? (
                      <View
                        style={{
                          borderRadius: 999,
                          alignSelf: 'flex-start',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.08)',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          marginBottom: 11,
                        }}
                      >
                        <CustomText
                          variant="caption"
                          style={{
                            color: 'rgba(226,219,246,0.84)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.68,
                            fontSize: 10,
                            lineHeight: 12,
                          }}
                        >
                          Secure account access
                        </CustomText>
                      </View>
                    ) : null}

                    <CustomText
                      variant="display"
                      style={{
                        color: '#F8F7FC',
                        fontSize: isDesktop ? 22 : isTablet ? 21 : narrow ? 18.5 : 19.5,
                        lineHeight: isDesktop ? 28 : isTablet ? 27 : narrow ? 23 : 24,
                      }}
                    >
                      {title}
                    </CustomText>
                    <CustomText
                      variant="body"
                      style={{
                        color: 'rgba(203,196,226,0.84)',
                        marginTop: isPhone ? 6 : 7,
                        fontSize: isPhone ? (narrow ? 12.6 : 13) : narrow ? 12.4 : 13.1,
                        lineHeight: isPhone ? 18 : narrow ? 18 : 19,
                      }}
                    >
                      {subtitle}
                    </CustomText>

                    {!isPhone ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }}>
                        {['Responsive layout', 'Email verification', 'Synced across devices'].map((item) => (
                          <View
                            key={item}
                            style={{
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.08)',
                              backgroundColor: 'rgba(255,255,255,0.028)',
                              paddingHorizontal: 9,
                              paddingVertical: 5,
                            }}
                          >
                            <CustomText
                              variant="caption"
                              style={{ color: 'rgba(232,225,249,0.82)', fontSize: 10.4, lineHeight: 12 }}
                            >
                              {item}
                            </CustomText>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={{ marginTop: isPhone ? 18 : 16 }}>{children}</View>
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
