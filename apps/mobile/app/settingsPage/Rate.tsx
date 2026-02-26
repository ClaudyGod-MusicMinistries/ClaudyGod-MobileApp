import React, { useMemo, useState } from 'react';
import { View, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { AppButton } from '../../components/ui/AppButton';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createAppRating } from '../../services/userFlowService';

export default function Rate() {
  const theme = useAppTheme();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const { config } = useMobileAppConfig();

  const scoreLabel = useMemo(() => {
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Great';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Needs work';
    if (rating >= 1) return 'Poor';
    return 'No rating selected';
  }, [rating]);

  const iosStoreUrl = config?.rate.iosStoreUrl ?? 'https://apps.apple.com/app/idYOUR_APP_ID';
  const androidStoreUrl =
    config?.rate.androidStoreUrl ?? 'https://play.google.com/store/apps/details?id=com.claudygod.mobile';
  const feedbackRoute = config?.rate.feedbackRoute ?? '/settingsPage/help';

  const goStore = async () => {
    if (rating <= 0) return;
    try {
      await createAppRating({ rating, channel: 'mobile' });
    } catch (error) {
      console.warn('rating submit failed:', error);
    }
    if (rating <= 3) {
      router.push(feedbackRoute as any);
      return;
    }
    const storeUrl = iosStoreUrl || androidStoreUrl;
    if (storeUrl) {
      void Linking.openURL(storeUrl);
    }
  };

  const openFeedback = async () => {
    if (rating > 0) {
      try {
        await createAppRating({ rating, channel: 'mobile' });
      } catch (error) {
        console.warn('rating submit failed:', error);
      }
    }
    router.push(feedbackRoute as any);
  };

  return (
    <SettingsScaffold
      title="Rate & Review"
      subtitle="Share your experience and help us improve."
      hero={
        <FadeIn>
          <SurfaceCard tone="subtle" style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
              Love the experience?
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
              Your rating helps improve discoverability on app stores and TV marketplaces.
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={80}>
        <SurfaceCard style={{ padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Select your rating
          </CustomText>
          <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
            {[1, 2, 3, 4, 5].map((star, index) => (
              <TVTouchable
                key={star}
                onPress={() => setRating(star)}
                style={{ marginRight: index === 4 ? 0 : spacing.sm }}
                showFocusBorder={false}
              >
                <MaterialIcons
                  name={rating >= star ? 'star' : 'star-border'}
                  size={34}
                  color={rating >= star ? '#FFC107' : theme.colors.text.secondary}
                />
              </TVTouchable>
            ))}
          </View>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: spacing.sm }}>
            {scoreLabel}
          </CustomText>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={140}>
        <View style={{ marginBottom: spacing.md }}>
          <AppButton
            title="Publish to App Store / Play Store"
            variant="primary"
            size="md"
            onPress={goStore}
            disabled={rating === 0}
            fullWidth
          />
        </View>
        <View style={{ marginBottom: spacing.md }}>
          <AppButton
            title="Send feedback to the team"
            variant="outline"
            size="md"
            onPress={openFeedback}
            fullWidth
          />
        </View>
      </FadeIn>

      <FadeIn delay={200}>
        <SurfaceCard tone="subtle" style={{ padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            What happens next?
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            4–5 stars open the store review flow. 1–3 stars route you to direct support for faster resolution.
          </CustomText>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}
