// app/settingsPage/Scaffold.tsx
import React from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
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
  const isDark = theme.scheme === 'dark';

  const ui = {
    stickyBg: isDark ? '#06040D' : theme.colors.background,
    stickyBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
  } as const;

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
          borderBottomColor: ui.stickyBorder,
          backgroundColor: ui.stickyBg,
        }}
      >
        <BrandedHeaderCard
          title={title}
          subtitle={subtitle}
          showEyebrow={false}
          leadingAction={{ icon: 'arrow-back', onPress: () => router.back(), accessibilityLabel: 'Go back' }}
          actions={[]}
        />
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
