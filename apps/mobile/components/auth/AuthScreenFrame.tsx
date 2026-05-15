import React from 'react';
import {
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && !isTV;
  const isDesktop = width >= 1120 && !isTV;
  const isPhone = !isTablet && !isTV;
  const compactViewport = height < 760;
  const shellWidth = isDesktop ? 1180 : isTablet ? 760 : 500;
  const formWidth = isDesktop ? 520 : shellWidth;

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <ImageBackground
        source={LANDING_BG_ASSET}
        resizeMode="cover"
        imageStyle={{ opacity: isDesktop ? 0.28 : 0.20 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={['rgba(8,5,15,0.58)', 'rgba(8,5,15,0.88)', '#08050F']}
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
            paddingTop: isDesktop ? 28 : 10,
            paddingBottom: isWeb ? (compactViewport ? 18 : 0) : 20,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          scrollEnabled
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
              <View style={{ paddingTop: 6 }}>
                <TVTouchable
                  onPress={() => router.replace(backPath)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.14)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <MaterialIcons name="arrow-back" size={21} color="#FFFFFF" />
                </TVTouchable>

                <View
                  style={{
                    marginTop: isDesktop ? 22 : 16,
                    width: '100%',
                    maxWidth: shellWidth,
                    alignSelf: 'center',
                    flexDirection: isDesktop ? 'row' : 'column',
                    alignItems: isDesktop ? 'stretch' : 'center',
                    gap: isDesktop ? 26 : isPhone ? 14 : 18,
                  }}
                >
                  {isDesktop ? (
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AuthBrandPanel salutation={salutation} description={description} />
                    </View>
                  ) : null}

                  <View
                    style={{
                      width: '100%',
                      maxWidth: formWidth,
                      flex: isDesktop ? 0.82 : undefined,
                      borderRadius: isPhone ? 22 : 28,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.13)',
                      backgroundColor: 'rgba(16,11,28,0.94)',
                      paddingHorizontal: isPhone ? 18 : 26,
                      paddingVertical: isPhone ? 20 : 26,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 18 },
                      shadowOpacity: 0.28,
                      shadowRadius: 34,
                      elevation: 12,
                    }}
                  >
                    {!isDesktop ? <AuthBrandPanel salutation={salutation} description={description} compact /> : null}

                    <View
                      style={{
                        alignSelf: isPhone ? 'center' : 'flex-start',
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.14)',
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <CustomText
                        variant="caption"
                        style={{ color: 'rgba(255,255,255,0.74)', textTransform: 'uppercase', letterSpacing: 0.72 }}
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
                        fontSize: isDesktop ? 32 : undefined,
                        lineHeight: isDesktop ? 38 : undefined,
                      }}
                    >
                      {title}
                    </CustomText>

                    <CustomText
                      variant="body"
                      style={{
                        color: 'rgba(255,255,255,0.72)',
                        marginTop: 8,
                        maxWidth: 440,
                        textAlign: isPhone ? 'center' : 'left',
                        alignSelf: isPhone ? 'center' : 'auto',
                        lineHeight: 21,
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
