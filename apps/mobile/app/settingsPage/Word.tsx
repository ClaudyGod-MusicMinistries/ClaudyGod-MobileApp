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
import { makeStyles } from '../../styles/makeStyles';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import type { WordOfDayItem } from '../../services/wordOfDayService';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // WordSection
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: `${theme.colors.primary}14`,
    borderWidth: 1, borderColor: `${theme.colors.primary}28`,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel:    { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  passageRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passageBar:      { width: 3, borderRadius: 2, backgroundColor: theme.colors.primary, minHeight: 18, alignSelf: 'stretch' },
  passageText:     { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  verseTitle:      { color: theme.colors.text, fontWeight: '700', letterSpacing: -0.2 },
  verseText:       { color: theme.colors.text },
  reflectionWrap:  { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14, gap: 6 },
  reflectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  reflectionLabel: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  reflectionBody:  { color: theme.colors.textSecondary },

  // Hero
  heroPad:       { padding: theme.spacing.xl, marginBottom: theme.spacing.lg, overflow: 'hidden' },
  heroRow:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconBox: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}14`,
    borderWidth: 1, borderColor: `${theme.colors.primary}28`,
  },
  heroRight:     { flex: 1, minWidth: 0 },
  heroEyebrow:   { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 },

  // States
  loadingPad:    { padding: theme.spacing.xl, alignItems: 'center' },
  actionsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emptyPad:      { padding: theme.spacing.xl, gap: 14 },
  emptyRow:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  emptyTextWrap: { flex: 1 },
  emptyBody:     { color: theme.colors.textSecondary, marginTop: 6 },
  emptyBtnRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // WordSection card
  wordCardPad:    { padding: theme.spacing.xl, gap: 16 },

  // Hero body text
  heroBodyTitle:   { color: theme.colors.text, marginTop: 4 },
  heroBodyPassage: { color: theme.colors.textSecondary, marginTop: 2 },

  // Offline state
  offlineHeading: { color: theme.colors.text },
}));

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
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();

  return (
    <FadeIn delay={delay}>
      <SurfaceCard tone="subtle" style={styles.wordCardPad}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBox}>
            <MaterialIcons name={sectionIcon} size={16} color={theme.colors.primary} />
          </View>
          <CustomText variant="caption" style={styles.sectionLabel}>
            {sectionLabel}
          </CustomText>
        </View>

        {word.passage ? (
          <View style={styles.passageRow}>
            <View style={styles.passageBar} />
            <CustomText variant="caption" style={styles.passageText}>
              {word.passage}
            </CustomText>
          </View>
        ) : null}

        {word.title && word.title !== word.passage ? (
          <CustomText variant="heading" style={styles.verseTitle}>
            {word.title}
          </CustomText>
        ) : null}

        {word.verse ? (
          <CustomText
            variant="title"
            style={[
              styles.verseText,
              {
                lineHeight: device.isTV ? 34 : device.isDesktop ? 30 : 27,
                fontSize: device.isTV ? 22 : device.isDesktop ? 19 : undefined,
                fontStyle: 'italic',
              },
            ]}
          >
            {'"'}{word.verse}{'"'}
          </CustomText>
        ) : null}

        {word.reflection ? (
          <View style={styles.reflectionWrap}>
            <View style={styles.reflectionHeader}>
              <MaterialIcons name="lightbulb-outline" size={13} color={theme.colors.primary} />
              <CustomText variant="caption" style={styles.reflectionLabel}>
                Reflection
              </CustomText>
            </View>
            <CustomText
              variant="body"
              style={[styles.reflectionBody, { lineHeight: device.isTV ? 26 : 23 }]}
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
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const { bibleVerse, adminWord, loading, hasContent } = useWordOfDay();

  const primaryWord = adminWord ?? bibleVerse;

  return (
    <SettingsScaffold
      title="Word for Today"
      subtitle="A focused reflection for worship, prayer, and your day."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.heroPad}>
            <View style={styles.heroRow}>
              <View style={styles.heroIconBox}>
                <MaterialIcons name="auto-stories" size={26} color={theme.colors.primary} />
              </View>
              <View style={styles.heroRight}>
                <CustomText variant="caption" style={styles.heroEyebrow}>
                  Daily reflection
                </CustomText>
                <CustomText variant="heading" style={styles.heroBodyTitle}>
                  {loading ? 'Loading...' : (primaryWord?.title ?? primaryWord?.passage ?? 'Today\'s reflection')}
                </CustomText>
                {primaryWord?.passage ? (
                  <CustomText variant="caption" style={styles.heroBodyPassage}>
                    {primaryWord.passage}
                  </CustomText>
                ) : null}
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {loading ? (
        <SurfaceCard tone="subtle" style={styles.loadingPad}>
          <BrandLoader label="Loading reflection" size="md" textColor={theme.colors.text} />
        </SurfaceCard>
      ) : null}

      {!loading && bibleVerse ? (
        <WordSection
          word={bibleVerse}
          sectionLabel="Daily Scripture"
          sectionIcon="menu-book"
          delay={60}
        />
      ) : null}

      {!loading && adminWord ? (
        <WordSection
          word={adminWord}
          sectionLabel="ClaudyGod Message"
          sectionIcon="church"
          delay={120}
        />
      ) : null}

      {!loading && hasContent ? (
        <FadeIn delay={180}>
          <View style={styles.actionsRow}>
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

      {!loading && !hasContent ? (
        <FadeIn delay={80}>
          <SurfaceCard tone="subtle" style={styles.emptyPad}>
            <View style={styles.emptyRow}>
              <MaterialIcons name="wifi-off" size={22} color={theme.colors.textMuted} />
              <View style={styles.emptyTextWrap}>
                <CustomText variant="heading" style={styles.offlineHeading}>
                  Offline
                </CustomText>
                <CustomText variant="body" style={styles.emptyBody}>
                  Today&apos;s reflection will appear once your connection is restored.
                </CustomText>
              </View>
            </View>
            <View style={styles.emptyBtnRow}>
              <AppButton title="Open music" onPress={() => router.push(APP_ROUTES.tabs.player)} />
              <AppButton title="Watch videos" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.videos)} />
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}
