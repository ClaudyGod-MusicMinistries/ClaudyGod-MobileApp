// app/settingsPage/Scaffold.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../../components/CustomText';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { spacing, radius } from '../../styles/designTokens';

interface ScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hero?: React.ReactNode;
}

export function SettingsScaffold({ title, subtitle, children, hero }: ScaffoldProps) {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme];
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg + 24,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
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
            backgroundColor: `${palette.surface}AA`,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <CustomText
            className="font-bold"
            style={{ color: palette.text.primary, fontSize: 22 }}
          >
            {title}
          </CustomText>
          {subtitle ? (
            <CustomText style={{ color: palette.text.secondary, marginTop: 2 }}>
              {subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: spacing.md }}
      >
        {hero}
        {children}
      </ScrollView>
    </View>
  );
}

