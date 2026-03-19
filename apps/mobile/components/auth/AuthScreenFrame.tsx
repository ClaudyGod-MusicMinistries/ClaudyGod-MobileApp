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
  const compact = width < 370;
  const compactViewport = height < 760;
  const shellWidth = isDesktop ? 1080 : isTablet ? 760 : '100%';

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
            paddingBottom: isWeb ? 0 : 20,
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
              <View style={{ paddingTop: compactViewport ? 4 : 10 }}>
                <TVTouchable
                  onPress={() => router.replace(backPath)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.14)',
                    backgroundColor: 'rgba(255,255,255,0.055)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={22} color="#F8F7FC" />
                </TVTouchable>

                <View
                  style={{
                    marginTop: compactViewport ? 12 : 16,
                    width: '100%',
                    maxWidth: shellWidth,
                    alignSelf: 'center',
                    borderRadius: isDesktop ? 30 : 24,
                    padding: isDesktop ? 20 : 0,
                    backgroundColor: isDesktop ? 'rgba(12,10,22,0.82)' : 'transparent',
                    borderWidth: 1,
                    borderColor: isDesktop ? 'rgba(235,226,255,0.10)' : 'transparent',
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
                      borderRadius: 24,
                      padding: isDesktop ? 26 : isTablet ? 24 : compactViewport ? 14 : compact ? 16 : 20,
                      backgroundColor: 'rgba(13,10,22,0.90)',
                      borderWidth: 1,
                      borderColor: 'rgba(235,226,255,0.14)',
                    }}
                  >
                    {!isDesktop ? <AuthBrandPanel salutation={salutation} description={description} /> : null}

                    <View
                      style={{
                        borderRadius: 999,
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        backgroundColor: 'rgba(255,255,255,0.045)',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        marginBottom: 12,
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{
                          color: 'rgba(226,219,246,0.84)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        Secure account access
                      </CustomText>
                    </View>

                    <CustomText
                      variant="display"
                      style={{
                        color: '#F8F7FC',
                        fontSize: isDesktop ? 24 : isTablet ? 24 : 22,
                        lineHeight: isDesktop ? 30 : isTablet ? 30 : 28,
                      }}
                    >
                      {title}
                    </CustomText>
                    <CustomText
                      variant="body"
                      style={{
                        color: 'rgba(203,196,226,0.84)',
                        marginTop: 8,
                        fontSize: 14,
                        lineHeight: 21,
                      }}
                    >
                      {subtitle}
                    </CustomText>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {['Smooth web auth', 'Email link recovery', 'Synced across devices'].map((item) => (
                        <View
                          key={item}
                          style={{
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.10)',
                            backgroundColor: 'rgba(255,255,255,0.035)',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          }}
                        >
                          <CustomText variant="caption" style={{ color: 'rgba(232,225,249,0.84)' }}>
                            {item}
                          </CustomText>
                        </View>
                      ))}
                    </View>

                    <View style={{ marginTop: 18 }}>{children}</View>
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
