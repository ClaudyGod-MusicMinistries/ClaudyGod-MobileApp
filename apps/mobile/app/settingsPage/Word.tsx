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
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import type { WordOfDayItem } from '../../services/wordOfDayService';

// ─── Section component ────────────────────────────────────────────────────────

function WordSection({
  word,
  sectionLabel,
  sectionIcon,
  delay = 0,
}: {
  word: WordOfDayItem;
  sectionLabel: string;
  sectionIcon: React.ComponentProps<typeof MaterialIcons>['name'];
  delay?: number;
}) {
  const theme = useAppTheme();
  const device = useDeviceClass();

  return (
    <FadeIn delay={delay}>
      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, gap: 16 }}>
        {/* Section header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: `${theme.colors.primary}14`,
              borderWidth: 1, borderColor: `${theme.colors.primary}28`,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialIcons name={sectionIcon} size={16} color={theme.colors.primary} />
          </View>
          <CustomText
            variant="caption"
            style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' }}
          >
            {sectionLabel}
          </CustomText>
        </View>

        {/* Passage reference */}
        {word.passage ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 3,
                borderRadius: 2,
                backgroundColor: theme.colors.primary,
                minHeight: 18,
                alignSelf: 'stretch',
              }}
            />
            <CustomText
              variant="caption"
              style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}
            >
              {word.passage}
            </CustomText>
          </View>
        ) : null}

        {/* Title */}
        {word.title && word.title !== word.passage ? (
          <CustomText
            variant="heading"
            style={{ color: theme.colors.text, fontWeight: '700', letterSpacing: -0.2 }}
          >
            {word.title}
          </CustomText>
        ) : null}

        {/* Verse */}
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
            {'“'}{word.verse}{'”'}
          </CustomText>
        ) : null}

        {/* Reflection */}
        {word.reflection ? (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingTop: 14,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="lightbulb-outline" size={13} color={theme.colors.primary} />
              <CustomText
                variant="caption"
                style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' }}
              >
                Reflection
              </CustomText>
            </View>
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
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WordForTodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { bibleVerse, adminWord, loading, hasContent } = useWordOfDay();

  const primaryWord = adminWord ?? bibleVerse;

  return (
    <SettingsScaffold
      title="Word for Today"
      subtitle="A focused reflection for worship, prayer, and your day."
      hero={
        <FadeIn>
          <SurfaceCard
            tone="strong"
            style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg, overflow: 'hidden' }}
          >
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
                <CustomText
                  variant="caption"
                  style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 }}
                >
                  Daily reflection
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 4 }}>
                  {loading ? 'Loading...' : (primaryWord?.title ?? primaryWord?.passage ?? 'Today\'s reflection')}
                </CustomText>
                {primaryWord?.passage ? (
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
                    {primaryWord.passage}
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

      {/* Bible API verse — always shown when available */}
      {!loading && bibleVerse ? (
        <WordSection
          word={bibleVerse}
          sectionLabel="Daily Scripture"
          sectionIcon="menu-book"
          delay={60}
        />
      ) : null}

      {/* Admin-authored message — shown as a second section when configured */}
      {!loading && adminWord ? (
        <WordSection
          word={adminWord}
          sectionLabel="ClaudyGod Message"
          sectionIcon="church"
          delay={120}
        />
      ) : null}

      {/* Quick actions — visible when any content loaded */}
      {!loading && hasContent ? (
        <FadeIn delay={180}>
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

      {/* Empty state — only when nothing loaded at all */}
      {!loading && !hasContent ? (
        <FadeIn delay={80}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <MaterialIcons name="wifi-off" size={22} color={theme.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <CustomText variant="heading" style={{ color: theme.colors.text }}>
                  Offline
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
                  Today&apos;s reflection will appear once your connection is restored.
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
