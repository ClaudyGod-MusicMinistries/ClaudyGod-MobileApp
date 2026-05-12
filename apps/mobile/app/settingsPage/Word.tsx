import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { BrandLoader } from '../../components/branding/BrandLoader';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';

export default function WordForTodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { word, loading } = useWordOfDay();

  return (
    <SettingsScaffold
      title="Word for Today"
      subtitle="A focused reflection for worship, prayer, and your day."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${theme.colors.primary}1A`,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <MaterialIcons name="auto-stories" size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}>
                  Daily reflection
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 4 }}>
                  {word?.title || word?.passage || 'Today’s reflection'}
                </CustomText>
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {loading ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
          <BrandLoader label="Loading reflection" size="md" textColor={theme.colors.text} />
        </SurfaceCard>
      ) : null}

      {!loading && word ? (
        <FadeIn delay={80}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            {word.passage ? (
              <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}>
                {word.passage}
              </CustomText>
            ) : null}
            {word.verse ? (
              <CustomText variant="title" style={{ color: theme.colors.text, marginTop: 10, lineHeight: 27 }}>
                {word.verse}
              </CustomText>
            ) : null}
            {word.reflection ? (
              <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 14, lineHeight: 23 }}>
                {word.reflection}
              </CustomText>
            ) : null}
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {!loading && !word ? (
        <FadeIn delay={80}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <MaterialIcons name="auto-stories" size={22} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <CustomText variant="heading" style={{ color: theme.colors.text }}>
                  Reflection unavailable
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
                  Continue with music, videos, or live ministry while today’s reflection is prepared.
                </CustomText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
              <AppButton title="Open music" onPress={() => router.push(APP_ROUTES.tabs.player)} />
              <AppButton title="Watch videos" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.videos)} />
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}
