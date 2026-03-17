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
  const compact = width < 370;
  const compactViewport = height < 760;

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
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
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
                    maxWidth: isTV ? 760 : isTablet ? 560 : '100%',
                    alignSelf: 'center',
                    borderRadius: 24,
                    padding: isTablet ? 24 : compactViewport ? 14 : compact ? 16 : 20,
                    backgroundColor: 'rgba(13,10,22,0.90)',
                    borderWidth: 1,
                    borderColor: 'rgba(235,226,255,0.14)',
                  }}
                >
                  <AuthBrandPanel salutation={salutation} description={description} />
                  <CustomText
                    variant="display"
                    style={{
                      color: '#F8F7FC',
                      fontSize: isTablet ? 30 : 26,
                      lineHeight: isTablet ? 36 : 31,
                    }}
                  >
                    {title}
                  </CustomText>
                  <CustomText
                    variant="body"
                    style={{ color: 'rgba(203,196,226,0.86)', marginTop: 8 }}
                  >
                    {subtitle}
                  </CustomText>

                  <View style={{ marginTop: 16 }}>{children}</View>
                </View>
              </View>
            </FadeIn>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
