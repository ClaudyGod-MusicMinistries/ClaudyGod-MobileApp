import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useAppModal } from '../../context/AppModalContext';
import { ENV } from '../../services/config';
import {
  fetchMePrivacyOverview,
  requestPrivacyDataExport,
  requestPrivacyDeleteAccount,
  resetRecommendationHistory,
} from '../../services/userFlowService';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Hero
  heroPad:       { padding: theme.spacing.xl, marginBottom: theme.spacing.lg },
  heroEyebrow:   { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 },
  heroDisplay:   { color: theme.colors.text, marginTop: 8 },
  heroBody:      { color: theme.colors.textSecondary, marginTop: 8 },

  // Stats row
  statsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:      { flexGrow: 1, minWidth: 130, padding: theme.spacing.md },
  statValue:     { color: theme.colors.text, marginTop: 8 },
  statLabel:     { color: theme.colors.textSecondary },

  // Section cards
  sectionPad:    { padding: theme.spacing.lg },
  sectionHead:   { color: theme.colors.text },
  sectionBody:   { color: theme.colors.textSecondary, marginTop: 8 },
  actionsList:   { gap: 10, marginTop: 14 },

  // Principle rows
  principlesList:{ gap: 10, marginTop: 12 },
  principleRow:  { flexDirection: 'row', gap: 10 },
  principleText: { color: theme.colors.textSecondary, flex: 1 },

  // PrivacyAction sub-component
  actionRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actionIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` },
  actionTextWrap:{ flex: 1 },
  actionTitle:   { color: theme.colors.text },
  actionDesc:    { color: theme.colors.textSecondary, marginTop: 3 },

  // Delete section
  deletePad:     { padding: theme.spacing.lg, borderColor: theme.colors.danger },
  deleteInput: {
    marginTop: 14, borderRadius: 16, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    color: theme.colors.text, paddingHorizontal: 14, paddingVertical: 12,
  },
  deleteInputSecond: { marginTop: 10 },
  deleteBtn:     { marginTop: 14, borderColor: theme.colors.danger },
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

function PrivacyStat({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <SurfaceCard tone="subtle" style={styles.statCard}>
      <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
      <CustomText variant="heading" style={styles.statValue}>{value}</CustomText>
      <CustomText variant="caption" style={styles.statLabel}>{label}</CustomText>
    </SurfaceCard>
  );
}

function PrivacyAction({ icon, title, description, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; title: string; description: string; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={styles.actionRow}>
        <View style={styles.actionIconBox}>
          <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.actionTextWrap}>
          <CustomText variant="label" style={styles.actionTitle}>{title}</CustomText>
          <CustomText variant="caption" style={styles.actionDesc}>{description}</CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </View>
    </TVTouchable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Privacy() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { config } = useMobileAppConfig();
  const { showModal } = useAppModal();
  const [loading,           setLoading]           = useState(true);
  const [summary,           setSummary]           = useState<{ totalRequests: number; totalPlayEvents: number; totalLiveSubscriptions: number } | null>(null);
  const [deleteName,        setDeleteName]        = useState('');
  const [deletePhraseInput, setDeletePhraseInput] = useState('');
  const [submittingDelete,  setSubmittingDelete]  = useState(false);

  const contactEmail  = config?.privacy?.contactEmail ?? 'privacy@claudygod.org';
  const deletePhrase  = config?.privacy?.deleteConfirmPhrase ?? 'I CONFIRM';
  const principles    = useMemo(() => config?.privacy?.principles ?? [], [config]);
  const canDelete     = deleteName.trim().length >= 3 && deletePhraseInput.trim().toUpperCase() === deletePhrase.trim().toUpperCase();

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

  useEffect(() => { void refreshPrivacy(); }, [refreshPrivacy]);

  const requestExport = async () => {
    try {
      const response = await requestPrivacyDataExport();
      showModal({ title: 'Export request submitted', message: `Request ${response.request.id.slice(0, 8)} has been received.`, tone: 'success', primaryAction: { label: 'Done' } });
      void refreshPrivacy();
    } catch (error) {
      showModal({ title: 'Request failed', message: error instanceof Error ? error.message : 'Please try again.', tone: 'error', primaryAction: { label: 'Try again' } });
    }
  };

  const performResetHistory = async () => {
    try {
      const response = await resetRecommendationHistory();
      showModal({ title: 'Recommendations reset', message: `Cleared ${response.clearedPlayEvents} playback event(s).`, tone: 'success', primaryAction: { label: 'Done' } });
      void refreshPrivacy();
    } catch (error) {
      showModal({ title: 'Reset failed', message: error instanceof Error ? error.message : 'Please try again.', tone: 'error', primaryAction: { label: 'Try again' } });
    }
  };

  const resetHistory = () => {
    showModal({
      title: 'Reset recommendations?',
      message: 'This clears the activity used to shape your recommendations. Your account and saved library stay intact.',
      tone: 'warning',
      primaryAction: { label: 'Reset', onPress: () => void performResetHistory() },
      secondaryAction: { label: 'Cancel', variant: 'secondary' },
    });
  };

  const performDeleteRequest = async () => {
    if (!canDelete) return;
    setSubmittingDelete(true);
    try {
      const response = await requestPrivacyDeleteAccount({ fullName: deleteName.trim(), confirmText: deletePhraseInput.trim() });
      setDeleteName('');
      setDeletePhraseInput('');
      showModal({ title: 'Delete request submitted', message: `Request ${response.request.id.slice(0, 8)} has been received.`, tone: 'success', primaryAction: { label: 'Done' } });
      void refreshPrivacy();
    } catch (error) {
      showModal({ title: 'Request failed', message: error instanceof Error ? error.message : 'Please try again.', tone: 'error', primaryAction: { label: 'Try again' } });
    }
    setSubmittingDelete(false);
  };

  const submitDeleteRequest = () => {
    if (!canDelete) return;
    showModal({
      title: 'Submit delete request?',
      message: 'This sends your account deletion request for review. You can still contact privacy support if you need help.',
      tone: 'danger',
      primaryAction: { label: 'Submit', onPress: () => void performDeleteRequest() },
      secondaryAction: { label: 'Cancel', variant: 'secondary' },
    });
  };

  return (
    <SettingsScaffold
      title="Privacy & Security"
      subtitle="Clear controls for account data, activity, and safety."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.heroPad}>
            <CustomText variant="caption" style={styles.heroEyebrow}>Privacy controls</CustomText>
            <CustomText variant="display" style={styles.heroDisplay}>Stay in control of your account.</CustomText>
            <CustomText variant="body" style={styles.heroBody}>
              Manage account access, exports, recommendations, and deletion requests from one place.
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={70}>
        <View style={styles.statsRow}>
          <PrivacyStat label="Requests"   value={loading ? '—' : `${summary?.totalRequests ?? 0}`}          icon="assignment" />
          <PrivacyStat label="Play events" value={loading ? '—' : `${summary?.totalPlayEvents ?? 0}`}        icon="history" />
          <PrivacyStat label="Live alerts" value={loading ? '—' : `${summary?.totalLiveSubscriptions ?? 0}`} icon="notifications-active" />
        </View>
      </FadeIn>

      <FadeIn delay={110}>
        <SurfaceCard tone="subtle" style={styles.sectionPad}>
          <CustomText variant="heading" style={styles.sectionHead}>Account actions</CustomText>
          <View style={styles.actionsList}>
            <PrivacyAction icon="password"          title="Password & sign in"      description="Account sign-in is coming soon."                onPress={() => showModal({ title: 'Coming soon', message: 'Account sign-in and password management are on the way. For now, ClaudyGod works fully as a guest.', tone: 'info', primaryAction: { label: 'Got it' } })} />
            <PrivacyAction icon="download"          title="Export my data"          description="Request a copy of account and activity data."   onPress={() => void requestExport()} />
            <PrivacyAction icon="history-toggle-off" title="Reset recommendations"  description="Clear activity used for recommendations."       onPress={resetHistory} />
            <PrivacyAction icon="email"             title="Contact privacy team"    description={contactEmail}                                   onPress={() => void Linking.openURL(`mailto:${contactEmail}`)} />
          </View>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={130}>
        <SurfaceCard tone="subtle" style={styles.sectionPad}>
          <CustomText variant="heading" style={styles.sectionHead}>Legal</CustomText>
          <View style={styles.actionsList}>
            <PrivacyAction icon="policy"    title="Privacy Policy"    description="How we collect and use your data." onPress={() => void Linking.openURL(`${ENV.apiUrl}/legal/privacy`)} />
            <PrivacyAction icon="gavel"     title="Terms of Service"  description="The rules for using ClaudyGod."     onPress={() => void Linking.openURL(`${ENV.apiUrl}/legal/terms`)} />
          </View>
        </SurfaceCard>
      </FadeIn>

      {principles.length ? (
        <FadeIn delay={150}>
          <SurfaceCard tone="subtle" style={styles.sectionPad}>
            <CustomText variant="heading" style={styles.sectionHead}>Privacy principles</CustomText>
            <View style={styles.principlesList}>
              {principles.map((principle) => (
                <View key={principle} style={styles.principleRow}>
                  <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} />
                  <CustomText variant="body" style={styles.principleText}>{principle}</CustomText>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      <FadeIn delay={190}>
        <SurfaceCard tone="subtle" style={styles.deletePad}>
          <CustomText variant="heading" style={styles.sectionHead}>Delete account request</CustomText>
          <CustomText variant="body" style={styles.sectionBody}>
            This sends a deletion request for review. Type the required phrase to confirm your intent.
          </CustomText>
          <TextInput
            value={deleteName}
            onChangeText={setDeleteName}
            placeholder="Full name"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.deleteInput}
          />
          <TextInput
            value={deletePhraseInput}
            onChangeText={setDeletePhraseInput}
            placeholder={`Type ${deletePhrase}`}
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="characters"
            style={[styles.deleteInput, styles.deleteInputSecond]}
          />
          <AppButton
            title="Submit delete request"
            variant="outline"
            fullWidth
            disabled={!canDelete || submittingDelete}
            loading={submittingDelete}
            loadingLabel="Submitting request"
            onPress={submitDeleteRequest}
            textColor={theme.colors.danger}
            style={styles.deleteBtn}
          />
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}
