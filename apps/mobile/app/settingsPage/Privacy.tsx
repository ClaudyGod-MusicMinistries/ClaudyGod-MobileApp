import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import {
  fetchMePrivacyOverview,
  requestPrivacyDataExport,
  requestPrivacyDeleteAccount,
  resetRecommendationHistory,
} from '../../services/userFlowService';

export default function Privacy() {
  const theme = useAppTheme();
  const router = useRouter();
  const { config } = useMobileAppConfig();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ totalRequests: number; totalPlayEvents: number; totalLiveSubscriptions: number } | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deletePhraseInput, setDeletePhraseInput] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const contactEmail = config?.privacy?.contactEmail ?? 'privacy@claudygod.org';
  const deletePhrase = config?.privacy?.deleteConfirmPhrase ?? 'I CONFIRM';
  const principles = useMemo(() => config?.privacy?.principles ?? [], [config]);
  const canDelete = deleteName.trim().length >= 3 && deletePhraseInput.trim().toUpperCase() === deletePhrase.trim().toUpperCase();

  const refreshPrivacy = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchMePrivacyOverview();
      setSummary(response.privacy);
    } catch {
      setSummary(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshPrivacy();
  }, [refreshPrivacy]);

  const requestExport = async () => {
    try {
      const response = await requestPrivacyDataExport();
      Alert.alert('Export request submitted', `Request ${response.request.id.slice(0, 8)} has been received.`);
      void refreshPrivacy();
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const resetHistory = async () => {
    try {
      const response = await resetRecommendationHistory();
      Alert.alert('Recommendations reset', `Cleared ${response.clearedPlayEvents} playback event(s).`);
      void refreshPrivacy();
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const submitDeleteRequest = async () => {
    if (!canDelete) return;
    setSubmittingDelete(true);
    try {
      const response = await requestPrivacyDeleteAccount({ fullName: deleteName.trim(), confirmText: deletePhraseInput.trim() });
      setDeleteName('');
      setDeletePhraseInput('');
      Alert.alert('Delete request submitted', `Request ${response.request.id.slice(0, 8)} has been received.`);
      void refreshPrivacy();
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Please try again.');
    }
    setSubmittingDelete(false);
  };

  return (
    <SettingsScaffold
      title="Privacy & Security"
      subtitle="Clear controls for account data, activity, and safety."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
              Privacy controls
            </CustomText>
            <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 8 }}>
              Stay in control of your account.
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
              Manage account access, exports, recommendations, and deletion requests from one place.
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={70}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <PrivacyStat label="Requests" value={loading ? '—' : `${summary?.totalRequests ?? 0}`} icon="assignment" />
          <PrivacyStat label="Play events" value={loading ? '—' : `${summary?.totalPlayEvents ?? 0}`} icon="history" />
          <PrivacyStat label="Live alerts" value={loading ? '—' : `${summary?.totalLiveSubscriptions ?? 0}`} icon="notifications-active" />
        </View>
      </FadeIn>

      <FadeIn delay={110}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Account actions
          </CustomText>
          <View style={{ gap: 10, marginTop: 14 }}>
            <PrivacyAction icon="password" title="Password & sign in" description="Update access through the sign-in flow." onPress={() => router.push(APP_ROUTES.auth.forgotPassword)} />
            <PrivacyAction icon="download" title="Export my data" description="Request a copy of account and activity data." onPress={() => void requestExport()} />
            <PrivacyAction icon="history-toggle-off" title="Reset recommendations" description="Clear activity used for recommendations." onPress={() => void resetHistory()} />
            <PrivacyAction icon="email" title="Contact privacy team" description={contactEmail} onPress={() => void Linking.openURL(`mailto:${contactEmail}`)} />
          </View>
        </SurfaceCard>
      </FadeIn>

      {principles.length ? (
        <FadeIn delay={150}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Privacy principles
            </CustomText>
            <View style={{ gap: 10, marginTop: 12 }}>
              {principles.map((principle) => (
                <View key={principle} style={{ flexDirection: 'row', gap: 10 }}>
                  <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} />
                  <CustomText variant="body" style={{ color: theme.colors.textSecondary, flex: 1 }}>
                    {principle}
                  </CustomText>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      <FadeIn delay={190}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, borderColor: theme.colors.danger }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Delete account request
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            This sends a deletion request for review. Type the required phrase to confirm your intent.
          </CustomText>
          <TextInput
            value={deleteName}
            onChangeText={setDeleteName}
            placeholder="Full name"
            placeholderTextColor={theme.colors.textSecondary}
            style={{ marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, paddingHorizontal: 14, paddingVertical: 12 }}
          />
          <TextInput
            value={deletePhraseInput}
            onChangeText={setDeletePhraseInput}
            placeholder={`Type ${deletePhrase}`}
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="characters"
            style={{ marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, paddingHorizontal: 14, paddingVertical: 12 }}
          />
          <AppButton
            title="Submit delete request"
            variant="outline"
            fullWidth
            disabled={!canDelete || submittingDelete}
            loading={submittingDelete}
            loadingLabel="Submitting request"
            onPress={() => void submitDeleteRequest()}
            textColor={theme.colors.danger}
            style={{ marginTop: 14, borderColor: theme.colors.danger }}
          />
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}

function PrivacyStat({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  const theme = useAppTheme();
  return (
    <SurfaceCard tone="subtle" style={{ flexGrow: 1, minWidth: 130, padding: theme.spacing.md }}>
      <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
      <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 8 }}>
        {value}
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
        {label}
      </CustomText>
    </SurfaceCard>
  );
}

function PrivacyAction({ icon, title, description, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; title: string; description: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` }}>
          <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <CustomText variant="label" style={{ color: theme.colors.text }}>
            {title}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
            {description}
          </CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </View>
    </TVTouchable>
  );
}
