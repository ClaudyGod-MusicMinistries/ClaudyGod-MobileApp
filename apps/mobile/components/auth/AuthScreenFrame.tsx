import React from 'react';
import { ImageBackground, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { FadeIn } from '../ui/FadeIn';
import { TVTouchable } from '../ui/TVTouchable';
import { AuthBrandPanel } from './AuthBrandPanel';
import { LANDING_BG_ASSET } from '../../util/brandAssets';
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
  const isPhone = device.isPhone;
  const showBrandPanel = device.prefersTwoPane;
  const shellWidth = device.isTV ? 1380 : device.isLargeDesktop ? 1220 : device.isDesktop ? 1140 : device.isTablet ? 760 : 500;
  const formWidth = device.isTV ? 560 : device.isDesktop ? 520 : shellWidth;

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <ImageBackground
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        imageStyle={{ opacity: showBrandPanel ? 0.26 : 0.18 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={['rgba(8,5,15,0.56)', 'rgba(8,5,15,0.88)', '#08050F']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1 }}
        />
      </ImageBackground>

      <StatusBar translucent={false} backgroundColor="#08050F" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: device.isTV ? 34 : isPhone ? 12 : 24,
            paddingBottom: device.isTV ? 34 : isPhone ? 18 : 28,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
          <Screen
            style={{ flex: 1 }}
            contentStyle={{
              flex: 1,
              justifyContent: 'center',
              maxWidth: shellWidth,
            }}
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
                      borderRadius: isPhone ? 22 : 30,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.14)',
                      backgroundColor: 'rgba(16,11,28,0.95)',
                      paddingHorizontal: isPhone ? 18 : device.isTV ? 32 : 26,
                      paddingVertical: isPhone ? 20 : device.isTV ? 32 : 26,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 18 },
                      shadowOpacity: 0.26,
                      shadowRadius: 34,
                      elevation: 12,
                    }}
                  >
                    {!showBrandPanel ? <AuthBrandPanel salutation={salutation} description={description} compact /> : null}

                    <View
                      style={{
                        alignSelf: isPhone ? 'center' : 'flex-start',
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.14)',
                        backgroundColor: 'rgba(255,255,255,0.075)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{ color: 'rgba(255,255,255,0.76)', textTransform: 'uppercase', letterSpacing: 0.72 }}
                      >
                        Secure access
                      </CustomText>
                    </View>

                    <CustomText
                      variant="display"
                      style={{
                        color: '#FFFFFF',
                        marginTop: 14,
                        textAlign: isPhone ? 'center' : 'left',
                        fontSize: device.isTV ? 38 : device.isDesktop ? 32 : undefined,
                        lineHeight: device.isTV ? 45 : device.isDesktop ? 38 : undefined,
                      }}
                    >
                      {title}
                    </CustomText>

                    <CustomText
                      variant="body"
                      style={{
                        color: 'rgba(255,255,255,0.76)',
                        marginTop: 8,
                        maxWidth: 460,
                        textAlign: isPhone ? 'center' : 'left',
                        alignSelf: isPhone ? 'center' : undefined,
                        lineHeight: device.isTV ? 24 : 21,
                        fontSize: device.isTV ? 15.5 : undefined,
                      }}
                    >
                      {subtitle}
                    </CustomText>

                    <View style={{ marginTop: isPhone ? 18 : 22 }}>{children}</View>
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
