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

export function AuthScreenFrame({ backPath, salutation, description, title, subtitle, children }: AuthScreenFrameProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTV = Platform.isTV;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && !isTV;
  const isDesktop = width >= 1120 && !isTV;
  const isPhone = !isTablet && !isTV;
  const compactViewport = height < 760;
  const shellWidth = isDesktop ? 1120 : isTablet ? 760 : 468;

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <StatusBar translucent={false} backgroundColor="#08050F" barStyle="light-content" />
      <LinearGradient colors={['rgba(183,148,246,0.20)', 'rgba(8,5,15,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: -100, top: -100, width: 360, height: 360, borderRadius: 360 }} />
      <LinearGradient colors={['rgba(124,58,237,0.16)', 'rgba(8,5,15,0)']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', right: -140, bottom: -140, width: 400, height: 400, borderRadius: 400 }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: isWeb ? 0 : 20 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          scrollEnabled={!isWeb || compactViewport}
          keyboardShouldPersistTaps="handled"
        >
          <Screen style={{ flex: 1 }} contentStyle={{ flex: 1, justifyContent: 'center' }}>
            <FadeIn>
              <View style={{ paddingTop: 6 }}>
                <TVTouchable onPress={() => router.replace(backPath)} style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }} showFocusBorder={false}>
                  <MaterialIcons name="arrow-back" size={21} color="#FFFFFF" />
                </TVTouchable>
                <View style={{ marginTop: 16, width: '100%', maxWidth: shellWidth, alignSelf: 'center', flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 20 : 0 }}>
                  {isDesktop ? <View style={{ flex: 0.95 }}><AuthBrandPanel salutation={salutation} description={description} /></View> : null}
                  <View style={{ flex: 1, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(16,11,28,0.88)', paddingHorizontal: isPhone ? 18 : 24, paddingVertical: isPhone ? 20 : 24 }}>
                    {!isDesktop ? <AuthBrandPanel salutation={salutation} description={description} compact={isPhone} /> : null}
                    <View style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 6 }}>
                      <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.70)', textTransform: 'uppercase', letterSpacing: 0.72 }}>Secure access</CustomText>
                    </View>
                    <CustomText variant="display" style={{ color: '#FFFFFF', marginTop: 14 }}>{title}</CustomText>
                    <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.70)', marginTop: 8, maxWidth: 420 }}>{subtitle}</CustomText>
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
