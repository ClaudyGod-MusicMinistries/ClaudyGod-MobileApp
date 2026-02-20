// app/settingsPage/Scaffold.tsx
import React from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';
import { Screen } from '../../components/layout/Screen';
import { TVTouchable } from '../../components/ui/TVTouchable';

interface ScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: React.ReactNode;
}

export function SettingsScaffold({ title, subtitle, children, hero }: ScaffoldProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={theme.colors.background} />
      <LinearGradient
        colors={['rgba(76,29,149,0.22)', 'rgba(10,10,15,0)']}
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
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            backgroundColor: theme.colors.surface,
          }}
        >
          <TVTouchable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            showFocusBorder={false}
          >
            <MaterialIcons name="arrow-back" size={22} color={theme.colors.text.primary} />
          </TVTouchable>
          <View style={{ flex: 1 }}>
            <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
              {title}
            </CustomText>
            {subtitle ? (
              <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                {subtitle}
              </CustomText>
            ) : null}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md }}
        >
          <Screen>
            {hero}
            {children}
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
