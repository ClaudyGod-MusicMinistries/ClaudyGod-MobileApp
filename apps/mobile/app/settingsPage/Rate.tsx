import React, { useMemo, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createAppRating } from '../../services/userFlowService';
import { useToast } from '../../context/ToastContext';
import { openExternalUrl } from '../../util/externalLinks';
import { PremiumSettingsHero } from '../../components/layout/PremiumSettingsHero';
import { SectionLabel } from '../../components/feed';
import { useAppContext } from '../../context/AppContext';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  sectionGap:    { gap: theme.spacing.sm },
  ratingCard:    { padding: theme.spacing.xl },
  ratingIntro:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingIcon:    { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.warningSurface, borderWidth: 1, borderColor: theme.colors.warningBorder },
  ratingCopy:    { flex: 1 },
  ratingHeading: { color: theme.colors.text },
  starsRow:      { flexDirection: 'row', marginTop: 20, gap: 8 },
  starButton:    { flex: 1, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.controlSurface, borderWidth: 1, borderColor: theme.colors.controlBorder },
  starButtonSelected: { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.warningBorder },
  scoreRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  scoreCaption:  { color: theme.colors.textSecondary },
  scoreValue:    { color: theme.colors.warning, fontWeight: '800' },
  noteCard:      { padding: theme.spacing.lg },
  noteHeading:   { color: theme.colors.text },
  noteBody:      { color: theme.colors.textSecondary, marginTop: 6 },
  textInput: {
    minHeight: 116, marginTop: 14, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: theme.colors.surface, color: theme.colors.text,
  },
  btnsGap: { gap: 10, marginTop: 14 },
  privacyNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 12 },
  privacyText: { flex: 1, color: theme.colors.textMuted, lineHeight: 18 },
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Rate() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { deviceId } = useAppContext();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { config } = useMobileAppConfig();

  const scoreLabel = useMemo(() => {
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Great';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Needs work';
    if (rating >= 1) return 'Poor';
    return 'Select a rating';
  }, [rating]);

  const iosStoreUrl = config?.rate?.iosStoreUrl ?? '';
  const androidStoreUrl = config?.rate?.androidStoreUrl ?? '';
  const feedbackRoute = config?.rate?.feedbackRoute ?? '/settingsPage/help';

  const saveRating = async () => {
    if (rating <= 0) return false;
    setSubmitting(true);
    try {
      await createAppRating({ rating, deviceId, channel: 'mobile', comment: comment.trim() || undefined });
      showToast({ title: 'Thank you', message: 'Your feedback has been saved.', tone: 'success' });
      setSubmitting(false);
      return true;
    } catch {
      showToast({ title: 'Feedback not saved', message: 'Please try again.', tone: 'warning' });
      setSubmitting(false);
      return false;
    }
  };

  const continueFlow = async () => {
    const saved = await saveRating();
    if (!saved) return;

    if (rating <= 3) {
      router.push(feedbackRoute as never);
      return;
    }

    const storeUrl = Platform.select({ ios: iosStoreUrl, android: androidStoreUrl, default: '' });
    if (storeUrl) {
      void openExternalUrl(storeUrl);
      return;
    }

    router.push(feedbackRoute as never);
  };

  return (
    <SettingsScaffold
      title="Rate & Review"
      subtitle="Share your experience and help improve the app."
      icon="star-rate"
      hero={
        <FadeIn>
          <PremiumSettingsHero eyebrow="Your voice matters" kicker="Product feedback" title="Help shape a better worship experience." description="Your rating is recorded by the ClaudyGod product team and helps us improve playback, navigation, accessibility, and reliability." badge="Private product feedback" badgeIcon="lock" />
        </FadeIn>
      }
    >
      <FadeIn delay={70}>
        <View style={styles.sectionGap}>
        <SectionLabel title="Your rating" accent="One quick step" />
        <SurfaceCard tone="subtle" style={styles.ratingCard}>
          <View style={styles.ratingIntro}>
            <View style={styles.ratingIcon}><MaterialIcons name="star" size={22} color={theme.colors.warning} /></View>
            <View style={styles.ratingCopy}><CustomText variant="heading" style={styles.ratingHeading}>How does ClaudyGod feel today?</CustomText><CustomText variant="caption" style={styles.scoreCaption}>Choose from 1 to 5 stars</CustomText></View>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TVTouchable key={star} onPress={() => setRating(star)} showFocusBorder={false} accessibilityRole="button" accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`} accessibilityState={{ selected: rating === star }} style={[styles.starButton, rating >= star && styles.starButtonSelected]}>
                <MaterialIcons
                  name={rating >= star ? 'star' : 'star-border'}
                  size={26}
                  color={rating >= star ? theme.colors.warning : theme.colors.textSecondary}
                />
              </TVTouchable>
            ))}
          </View>
          <View style={styles.scoreRow}><CustomText variant="caption" style={styles.scoreCaption}>{scoreLabel}</CustomText><CustomText variant="label" style={styles.scoreValue}>{rating ? `${rating}.0 / 5` : '— / 5'}</CustomText></View>
        </SurfaceCard>
        </View>
      </FadeIn>

      <FadeIn delay={110}>
        <View style={styles.sectionGap}>
        <SectionLabel title="Add context" accent="Optional" />
        <SurfaceCard tone="subtle" style={styles.noteCard}>
          <CustomText variant="heading" style={styles.noteHeading}>Optional note</CustomText>
          <CustomText variant="body" style={styles.noteBody}>
            Share what worked well or what needs improvement.
          </CustomText>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What stood out in your experience?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={styles.textInput}
          />
          <View style={styles.privacyNote}><MaterialIcons name="privacy-tip" size={16} color={theme.colors.textMuted} /><CustomText variant="caption" style={styles.privacyText}>Feedback is linked to this installation so sign-in is not required. Do not include passwords or payment details.</CustomText></View>
          <View style={styles.btnsGap}>
            <AppButton
              title="Continue"
              loading={submitting}
              loadingLabel="Saving"
              disabled={rating === 0 || submitting}
              onPress={() => void continueFlow()}
              fullWidth
            />
            <AppButton
              title="Open support instead"
              variant="secondary"
              onPress={() => router.push(feedbackRoute as never)}
              fullWidth
            />
          </View>
        </SurfaceCard>
        </View>
      </FadeIn>
    </SettingsScaffold>
  );
}
