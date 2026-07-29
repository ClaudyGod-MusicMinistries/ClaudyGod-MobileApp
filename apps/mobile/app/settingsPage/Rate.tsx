import React, { useMemo, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  heroCard:      { padding: theme.spacing.xl, marginBottom: theme.spacing.lg },
  eyebrow:       { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 },
  displayText:   { color: theme.colors.text, marginTop: 8 },
  bodyText:      { color: theme.colors.textSecondary, marginTop: 8 },
  ratingCard:    { padding: theme.spacing.xl, alignItems: 'center' },
  ratingHeading: { color: theme.colors.text },
  starsRow:      { flexDirection: 'row', marginTop: 16, gap: 8 },
  scoreCaption:  { color: theme.colors.textSecondary, marginTop: 10 },
  noteCard:      { padding: theme.spacing.lg },
  noteHeading:   { color: theme.colors.text },
  noteBody:      { color: theme.colors.textSecondary, marginTop: 6 },
  textInput: {
    minHeight: 116, marginTop: 14, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: theme.colors.surface, color: theme.colors.text,
  },
  btnsGap: { gap: 10, marginTop: 14 },
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Rate() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
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
      await createAppRating({ rating, channel: 'mobile', comment: comment.trim() || undefined });
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

    const storeUrl = iosStoreUrl || androidStoreUrl;
    if (storeUrl) {
      void Linking.openURL(storeUrl);
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
          <SurfaceCard tone="strong" style={styles.heroCard}>
            <CustomText variant="caption" style={styles.eyebrow}>
              User feedback
            </CustomText>
            <CustomText variant="display" style={styles.displayText}>
              Tell us how the experience feels.
            </CustomText>
            <CustomText variant="body" style={styles.bodyText}>
              Your rating helps improve playback, navigation, and the worship experience across devices.
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={70}>
        <SurfaceCard tone="subtle" style={styles.ratingCard}>
          <CustomText variant="heading" style={styles.ratingHeading}>
            Select your rating
          </CustomText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TVTouchable key={star} onPress={() => setRating(star)} showFocusBorder={false}>
                <MaterialIcons
                  name={rating >= star ? 'star' : 'star-border'}
                  size={38}
                  color={rating >= star ? theme.colors.warning : theme.colors.textSecondary}
                />
              </TVTouchable>
            ))}
          </View>
          <CustomText variant="caption" style={styles.scoreCaption}>{scoreLabel}</CustomText>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={110}>
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
            textAlignVertical="top"
            style={styles.textInput}
          />
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
      </FadeIn>
    </SettingsScaffold>
  );
}
