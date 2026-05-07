import React from 'react';
import { ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from './Screen';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { SurfaceCard } from '../ui/SurfaceCard';

interface SettingsScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: React.ReactNode;
}

export function SettingsScaffold({ title, subtitle, children, hero }: SettingsScaffoldProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <LinearGradient
        colors={theme.scheme === 'dark' ? ['rgba(76,29,149,0.24)', 'rgba(10,6,18,0.00)'] : ['rgba(124,58,237,0.12)', 'rgba(249,247,254,0.00)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300, pointerEvents: 'none' }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, paddingBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TVTouchable
                onPress={() => router.back()}
                style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}
                showFocusBorder={false}
                accessibilityLabel="Go back"
              >
                <MaterialIcons name="arrow-back" size={21} color={theme.colors.text} />
              </TVTouchable>
              <View style={{ flex: 1 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  ClaudyGod
                </CustomText>
                <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 2, fontSize: isTablet ? 25 : 20, lineHeight: isTablet ? 31 : 26 }} numberOfLines={1}>
                  {title}
                </CustomText>
                {subtitle ? (
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }} numberOfLines={2}>
                    {subtitle}
                  </CustomText>
                ) : null}
              </View>
            </View>
          </View>
        </Screen>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130, paddingTop: theme.spacing.md }} overScrollMode="never" bounces={false}>
          <Screen>
            <SurfaceCard tone="strong" style={{ padding: isTablet ? theme.spacing.xl : theme.spacing.lg, marginBottom: theme.spacing.lg }}>
              {hero ?? (
                <View style={{ gap: 8 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text }}>{title}</CustomText>
                  {subtitle ? <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>{subtitle}</CustomText> : null}
                </View>
              )}
            </SurfaceCard>
            {children}
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
