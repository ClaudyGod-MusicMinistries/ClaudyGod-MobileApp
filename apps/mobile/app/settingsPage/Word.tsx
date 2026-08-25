import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { BrandLoader } from '../../components/branding/BrandLoader';
import { ErrorState } from '../../components/ui/ErrorState';
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
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
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
  teachingSteps:   { gap: theme.spacing.md },
  teachingStep:    { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  teachingNumber: {
    width: 38, height: 34, borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  teachingNumberText: { color: theme.colors.primary, fontWeight: '800' },
  teachingCopy:       { flex: 1, gap: theme.spacing.xs },
  teachingTitle:      { color: theme.colors.text },
  teachingBody:       { color: theme.colors.textSecondary },

  // Hero
  heroPad: {
    padding: theme.spacing.xl, marginBottom: theme.spacing.sm, overflow: 'hidden',
    borderRadius: theme.radius.xxl, minHeight: 230, justifyContent: 'space-between',
    ...theme.shadows.lg,
  },
  heroRow:       { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  heroIconBox: {
    width: 56, height: 56, borderRadius: theme.radius.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.glass,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  heroRight:     { flex: 1, minWidth: 0 },
  heroEyebrow:   { color: theme.colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800' },
  heroVerse:     { color: theme.colors.onPrimary, marginTop: theme.spacing.lg, lineHeight: 29 },
  heroReference: { color: theme.colors.onPrimary, opacity: 0.82, marginTop: theme.spacing.md },

  // States
  loadingPad:    { padding: theme.spacing.xl, alignItems: 'center' },
  actionsRow:    { gap: theme.spacing.sm },
  emptyPad:      { padding: theme.spacing.xl, gap: 14 },
  emptyRow:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  emptyTextWrap: { flex: 1 },
  emptyBody:     { color: theme.colors.textSecondary, marginTop: 6 },
  emptyBtnRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // WordSection card
  wordCardPad:    { padding: theme.spacing.xl, gap: 16 },

  // Hero body text
  heroBodyTitle:   { color: theme.colors.onPrimary, marginTop: 4 },

  // Offline state
  offlineHeading: { color: theme.colors.text },
}));

// ─── Section component ────────────────────────────────────────────────────────

function WordSection({
  word,
  sectionLabel,
  sectionIcon,
  reflectionOnly = false,
  delay = 0,
}: {
  word: WordOfDayItem;
  sectionLabel: string;
  sectionIcon: React.ComponentProps<typeof MaterialIcons>['name'];
  reflectionOnly?: boolean;
  delay?: number;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();

  return (
    <FadeIn delay={delay}>
      <SurfaceCard tone="strong" style={styles.wordCardPad}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBox}>
            <MaterialIcons name={sectionIcon} size={16} color={theme.colors.primary} />
          </View>
          <CustomText variant="caption" style={styles.sectionLabel}>
            {sectionLabel}
          </CustomText>
        </View>

        {!reflectionOnly && word.passage ? (
          <View style={styles.passageRow}>
            <View style={styles.passageBar} />
            <CustomText variant="caption" style={styles.passageText}>
              {word.passage}
            </CustomText>
          </View>
        ) : null}

        {!reflectionOnly && word.title && word.title !== word.passage ? (
          <CustomText variant="heading" style={styles.verseTitle}>
            {word.title}
          </CustomText>
        ) : null}

        {!reflectionOnly && word.verse ? (
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
  const { bibleVerse, adminWord, loading, hasContent, error, refresh } = useWordOfDay();

  const primaryWord = adminWord ?? bibleVerse;
  const teachingSections = adminWord
    ? [
        { number: '01', title: 'Teaching', body: adminWord.teaching },
        { number: '02', title: 'Practical application', body: adminWord.application },
        { number: '03', title: 'Guided prayer', body: adminWord.prayer },
      ].filter((section): section is { number: string; title: string; body: string } => Boolean(section.body?.trim()))
    : [];

  return (
    <SettingsScaffold
      title="Word for Today"
      subtitle="A focused reflection for worship, prayer, and your day."
      icon="auto-stories"
      hero={primaryWord ? (
        <FadeIn>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroPad}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroIconBox}>
                <MaterialIcons name="auto-stories" size={26} color={theme.colors.onPrimary} />
              </View>
              <View style={styles.heroRight}>
                <CustomText variant="caption" style={styles.heroEyebrow}>
                  Daily reflection
                </CustomText>
                <CustomText variant="heading" style={styles.heroBodyTitle}>
                  {primaryWord.title || primaryWord.passage}
                </CustomText>
              </View>
            </View>
            {primaryWord?.verse ? (
              <CustomText variant="title" style={styles.heroVerse} numberOfLines={6}>
                {primaryWord.verse}
              </CustomText>
            ) : null}
            {primaryWord?.passage ? (
              <CustomText variant="caption" style={styles.heroReference}>{primaryWord.passage}</CustomText>
            ) : null}
          </LinearGradient>
        </FadeIn>
      ) : undefined}
    >
      {loading ? (
        <SurfaceCard tone="subtle" style={styles.loadingPad}>
          <BrandLoader label="Loading reflection" size="md" textColor={theme.colors.text} />
        </SurfaceCard>
      ) : null}

      {!loading && error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}

      {!loading && primaryWord?.reflection ? (
        <WordSection
          word={primaryWord}
          sectionLabel="Today’s reflection"
          sectionIcon="lightbulb-outline"
          reflectionOnly
          delay={60}
        />
      ) : null}

      {!loading && teachingSections.length > 0 ? (
        <FadeIn delay={160}>
          <SurfaceCard tone="strong" style={styles.wordCardPad}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBox}>
                <MaterialIcons name="school" size={16} color={theme.colors.primary} />
              </View>
              <CustomText variant="caption" style={styles.sectionLabel}>Today&apos;s teaching journey</CustomText>
            </View>
            <View style={styles.teachingSteps}>
              {teachingSections.map((section) => (
                <View key={section.number} style={styles.teachingStep}>
                  <View style={styles.teachingNumber}><CustomText style={styles.teachingNumberText}>{section.number}</CustomText></View>
                  <View style={styles.teachingCopy}>
                    <CustomText variant="heading" style={styles.teachingTitle}>{section.title}</CustomText>
                    <CustomText variant="body" style={styles.teachingBody}>{section.body}</CustomText>
                  </View>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {!loading && hasContent ? (
        <FadeIn delay={220}>
          <View style={styles.actionsRow}>
            <AppButton
              title="Explore music"
              variant="gradient"
              size="lg"
              fullWidth
              onPress={() => router.push(APP_ROUTES.tabs.player)}
              leftIcon={<MaterialIcons name="graphic-eq" size={16} color={theme.colors.textInverse} />}
            />
            <AppButton
              title="Watch videos"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => router.push(APP_ROUTES.tabs.videos)}
              leftIcon={<MaterialIcons name="smart-display" size={16} color={theme.colors.text} />}
            />
          </View>
        </FadeIn>
      ) : null}

      {!loading && !hasContent && !error ? (
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
