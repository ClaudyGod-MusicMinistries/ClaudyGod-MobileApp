import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { BrandLoader } from '../../components/branding/BrandLoader';
import { useWordOfDay } from '../../hooks/useWordOfDay';
import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';

export default function WordForTodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { word, loading } = useWordOfDay();

  return (
    <SettingsScaffold
      title="Word for Today"
      subtitle="A focused reflection for worship, prayer, and your day."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(183,148,246,0.14)', 'rgba(183,148,246,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, pointerEvents: 'none' }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${theme.colors.primary}14`,
                  borderWidth: 1, borderColor: `${theme.colors.primary}28`,
                }}
              >
                <MaterialIcons name="auto-stories" size={26} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}>
                  Daily reflection
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 4 }}>
                  {word?.title || word?.passage || 'Today\'s reflection'}
                </CustomText>
                {word?.passage ? (
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
                    {word.passage}
                  </CustomText>
                ) : null}
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {/* Loading */}
      {loading ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
          <BrandLoader label="Loading reflection" size="md" textColor={theme.colors.text} />
        </SurfaceCard>
      ) : null}

      {/* Verse and reflection */}
      {!loading && word ? (
        <FadeIn delay={80}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, gap: 16 }}>
            {word.passage ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 3, height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary, minHeight: 18 }} />
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {word.passage}
                </CustomText>
              </View>
            ) : null}

            {word.verse ? (
              <CustomText
                variant="title"
                style={{
                  color: theme.colors.text,
                  lineHeight: device.isTV ? 34 : device.isDesktop ? 30 : 27,
                  fontSize: device.isTV ? 22 : device.isDesktop ? 19 : undefined,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{word.verse}&rdquo;
              </CustomText>
            ) : null}

            {word.reflection ? (
              <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                  Reflection
                </CustomText>
                <CustomText
                  variant="body"
                  style={{
                    color: theme.colors.textSecondary,
                    lineHeight: device.isTV ? 26 : 23,
                  }}
                >
                  {word.reflection}
                </CustomText>
              </View>
            ) : null}
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {/* Quick actions */}
      {!loading && word ? (
        <FadeIn delay={140}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <AppButton
              title="Explore music"
              onPress={() => router.push(APP_ROUTES.tabs.player)}
              leftIcon={<MaterialIcons name="graphic-eq" size={16} color={theme.colors.textInverse} />}
            />
            <AppButton
              title="Watch videos"
              variant="secondary"
              onPress={() => router.push(APP_ROUTES.tabs.videos)}
              leftIcon={<MaterialIcons name="smart-display" size={16} color={theme.colors.text} />}
            />
          </View>
        </FadeIn>
      ) : null}

      {/* Empty state */}
      {!loading && !word ? (
        <FadeIn delay={80}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <MaterialIcons name="auto-stories" size={24} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <CustomText variant="heading" style={{ color: theme.colors.text }}>
                  Reflection unavailable
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
                  Continue with music, videos, or live ministry while today's reflection is prepared.
                </CustomText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <AppButton title="Open music" onPress={() => router.push(APP_ROUTES.tabs.player)} />
              <AppButton title="Watch videos" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.videos)} />
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}