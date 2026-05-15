import React from 'react';
import { ImageBackground, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../util/colorScheme';
import { Screen } from './Screen';
import { SurfaceCard } from '../ui/SurfaceCard';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { AppScreenFooter } from './AppScreenFooter';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';
import { APP_ROUTES } from '../../util/appRoutes';

interface SettingsScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: React.ReactNode;
  backRoute?: string;
}

export function SettingsScaffold({ title, subtitle, children, hero, backRoute = APP_ROUTES.tabs.home }: SettingsScaffoldProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 420;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        translucent={false}
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <ImageBackground
        source={BRAND_HERO_ASSET}
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: compact ? 220 : 280 }}
      >
        <LinearGradient
          colors={
            theme.scheme === 'dark'
              ? ['rgba(6,4,12,0.28)', 'rgba(6,4,12,0.72)', theme.colors.background]
              : ['rgba(124,58,237,0.10)', 'rgba(250,247,255,0.70)', theme.colors.background]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.86, y: 1 }}
          style={{ flex: 1 }}
        />
      </ImageBackground>

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{ paddingBottom: 124 }}
        >
          <Screen>
            <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap }}>
              <SurfaceCard tone="strong" style={{ paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TVTouchable
                    onPress={() => router.replace(backRoute as never)}
                    showFocusBorder={false}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : theme.colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                    accessibilityLabel="Go back"
                  >
                    <MaterialIcons name="chevron-left" size={23} color={theme.colors.text} />
                  </TVTouchable>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }} numberOfLines={1}>
                      ClaudyGod
                    </CustomText>
                    <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 2 }} numberOfLines={1}>
                      {title}
                    </CustomText>
                    {subtitle ? (
                      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
                        {subtitle}
                      </CustomText>
                    ) : null}
                  </View>
                </View>
              </SurfaceCard>

              {hero ? <View style={{ marginTop: -2 }}>{hero}</View> : null}
              {children}
              <AppScreenFooter />
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
