// app/settingsPage/Rate.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius, shadows } from '../../styles/designTokens';
import { useRouter } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';

export default function Rate() {
  const theme = useAppTheme();
  const router = useRouter();
  const [rating, setRating] = useState(0);

  const goStore = () => Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID');
  const openFeedback = () => router.push('/settingsPage/help');

  return (
    <SettingsScaffold
      title="Rate & Review"
      subtitle="Tell us how we’re doing across mobile and TV."
      hero={
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: spacing.lg,
            ...shadows.card,
          }}
        >
          <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
            Love the experience?
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
            Ratings boost discoverability on TVs and app stores. If something’s off, we’ll fix it fast.
          </CustomText>
        </View>
      }
    >
      {/* Stars */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <MaterialIcons
                name={rating >= star ? 'star' : 'star-border'}
                size={32}
                color={rating >= star ? '#FFC107' : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: spacing.sm }}>
          Tap to choose 1–5 stars
        </CustomText>
      </View>

      {/* Actions */}
      <View style={{ gap: spacing.md }}>
        <AppButton
          title="Publish to App Store / Play Store"
          variant="primary"
          size="md"
          onPress={goStore}
          disabled={rating === 0}
          style={rating === 0 ? { opacity: 0.6 } : undefined}
          textColor={theme.colors.text.inverse}
        />

        <AppButton
          title="Send feedback to the team"
          variant="outline"
          size="md"
          onPress={openFeedback}
        />
      </View>

      <View style={{ marginTop: spacing.lg, padding: spacing.md, backgroundColor: `${theme.colors.primary}12`, borderRadius: radius.md }}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>What happens next?</CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
          4–5 stars open the store to post a review. 1–3 stars route you to support so we can respond within a day.
        </CustomText>
      </View>
    </SettingsScaffold>
  );
}
