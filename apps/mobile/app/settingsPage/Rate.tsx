import React, { useMemo, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createAppRating } from '../../services/userFlowService';
import { useToast } from '../../context/ToastContext';

export default function Rate() {
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
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
              User feedback
            </CustomText>
            <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 8 }}>
              Tell us how the experience feels.
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
              Your rating helps improve playback, navigation, and the worship experience across devices.
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={70}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Select your rating
          </CustomText>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TVTouchable key={star} onPress={() => setRating(star)} showFocusBorder={false}>
                <MaterialIcons name={rating >= star ? 'star' : 'star-border'} size={38} color={rating >= star ? theme.colors.warning : theme.colors.textSecondary} />
              </TVTouchable>
            ))}
          </View>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 10 }}>
            {scoreLabel}
          </CustomText>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={110}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Optional note
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
            Share what worked well or what needs improvement.
          </CustomText>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What stood out in your experience?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 116, marginTop: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.surface, color: theme.colors.text }}
          />
          <View style={{ gap: 10, marginTop: 14 }}>
            <AppButton title="Continue" loading={submitting} loadingLabel="Saving" disabled={rating === 0 || submitting} onPress={() => void continueFlow()} fullWidth />
            <AppButton title="Open support instead" variant="secondary" onPress={() => router.push(feedbackRoute as never)} fullWidth />
          </View>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}
