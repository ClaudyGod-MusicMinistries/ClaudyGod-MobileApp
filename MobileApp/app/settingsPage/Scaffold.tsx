// app/settingsPage/Scaffold.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../../components/CustomText';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';
import { Screen } from '../../components/layout/Screen';

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
      <StatusBar barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg + 24,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${theme.colors.surface}AA`,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
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
        contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md }}
      >
        <Screen>
          {hero}
          {children}
        </Screen>
      </ScrollView>
    </View>
  );
}
