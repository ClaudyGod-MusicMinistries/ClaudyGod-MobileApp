// app/settingsPage/Scaffold.tsx
import React from 'react';
import { View, ScrollView, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../../components/CustomText';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';
import { Screen } from '../../components/layout/Screen';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: React.ReactNode;
}

export function SettingsScaffold({ title, subtitle, children, hero }: ScaffoldProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={
          theme.scheme === 'dark'
            ? ['rgba(76,29,149,0.22)', 'rgba(10,10,15,0)']
            : ['rgba(124,58,237,0.12)', 'rgba(255,255,255,0)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 260,
        }}
      />
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + 8,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#06040D',
        }}
      >
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(10,8,17,0.88)',
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <TVTouchable
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
              showFocusBorder={false}
            >
              <MaterialIcons name="arrow-back" size={20} color="#EFE7FF" />
            </TVTouchable>

            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Image source={require('../../assets/images/ClaudyGoLogo.webp')} style={{ width: 30, height: 30, borderRadius: 15 }} />
            </View>

            <View style={{ flex: 1 }}>
              <CustomText variant="caption" style={{ color: 'rgba(194,185,220,0.9)' }}>
                ClaudyGod Ministries
              </CustomText>
              <CustomText variant="heading" style={{ color: '#F8F7FC', marginTop: 2 }}>
                {title}
              </CustomText>
              {subtitle ? (
                <CustomText variant="caption" style={{ color: 'rgba(176,167,202,0.9)', marginTop: 3 }} numberOfLines={1}>
                  {subtitle}
                </CustomText>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md, flexGrow: 1 }}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          {hero}
          {children}
        </Screen>
      </ScrollView>
    </View>
  );
}
