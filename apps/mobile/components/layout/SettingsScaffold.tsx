import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from './Screen';
import { BrandedHeaderCard } from './BrandedHeaderCard';

interface SettingsScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: React.ReactNode;
}

export function SettingsScaffold({
  title,
  subtitle,
  children,
  hero,
}: SettingsScaffoldProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        translucent={false}
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <LinearGradient
        colors={['rgba(76,29,149,0.22)', 'rgba(10,10,15,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 260,
          pointerEvents: 'none',
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Screen>
          <View
            style={{
              paddingTop: theme.layout.headerVerticalPadding,
              paddingBottom: theme.spacing.sm,
            }}
          >
            <BrandedHeaderCard
              title={title}
              subtitle={subtitle}
              leadingAction={{
                icon: 'arrow-back',
                onPress: () => router.back(),
                accessibilityLabel: 'Go back',
              }}
            />
          </View>
        </Screen>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: theme.layout.sectionGap }}
          overScrollMode="never"
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
