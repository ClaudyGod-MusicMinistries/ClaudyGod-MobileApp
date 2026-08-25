import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { PremiumPage } from '../../components/feed';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useReferral } from '../../hooks/useReferral';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  intro: { padding: theme.spacing.xl, gap: 10 },
  eyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  introBody: { color: theme.colors.textSecondary, lineHeight: 22 },
  progress: { flexDirection: 'row', gap: 8, marginTop: 4 },
  progressStep: { flex: 1, height: 3, borderRadius: 3, backgroundColor: theme.colors.border },
  progressActive: { backgroundColor: theme.colors.primary },
  // CodeDisplay
  codeCenterWrap:  { alignItems: 'center', paddingVertical: 22, gap: 10 },
  codePill: {
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5, borderColor: theme.colors.primaryBorder,
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 24, width: '100%', justifyContent: 'space-between',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  codeText: {
    color: theme.colors.text_accent,
    fontSize: 28, fontWeight: '800', letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  codeCopiedText:  { color: theme.colors.success, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  codeMutedText:   { color: theme.colors.textMuted, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  shareBtn:        { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 10, elevation: 8 },


  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metric: { flex: 1, padding: 13, borderRadius: 16, backgroundColor: theme.colors.controlSurface, borderWidth: 1, borderColor: theme.colors.controlBorder },
  metricValue: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  metricLabel: { color: theme.colors.textSecondary, marginTop: 2 },

  // Cards padding
  loadingPad:      { padding: 40, alignItems: 'center' },
  codePadCard:     { padding: theme.spacing.lg, gap: 14 },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  codeHeaderCopy: { flex: 1 },
  codeHeading: { color: theme.colors.text },
  codeBody: { color: theme.colors.textSecondary, marginTop: 3 },

  // How it works
  cardTitle:       { color: theme.colors.text },
  cardDescription: { color: theme.colors.textSecondary, lineHeight: 20 },
  stepsPad:        { padding: theme.spacing.lg, gap: 18 },
  stepRow:         { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepIconBox: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepBody:        { flex: 1 },
  stepTitle:       { color: theme.colors.text, fontSize: 13.5, fontWeight: '700', marginBottom: 3 },
  stepDesc:        { color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18 },

  // Rewards
  rewardsPad:      { padding: theme.spacing.lg, gap: 14 },
  rewardsList:     { gap: 10 },
  rewardCard:      { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rewardTextWrap:  { flex: 1 },
  rewardTier:      { color: theme.colors.primary, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  rewardName:      { color: theme.colors.text, fontSize: 13.5, fontWeight: '600' },
  rewardIconBox:   { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
}));

// ─── Constants ────────────────────────────────────────────────────────────────

// Fallback-only — used before admin config has loaded, or if it's ever empty.
// Mirrors the same defaults now configurable via admin's Mobile config → Referral.
const DEFAULT_HOW_IT_WORKS = [
  { icon: 'share',      title: 'Share your link',     body: 'Send your unique referral link to friends and family.' },
  { icon: 'mobile-friendly', title: 'They open ClaudyGod', body: 'Your friend can explore the guest-first experience without being forced to create an account.' },
  { icon: 'verified', title: 'Attribution stays accurate', body: 'The backend records eligible joins against your unique invitation code.' },
];

const DEFAULT_REWARD_TIERS = [
  { icon: 'library-music',     threshold: 1,  reward: 'Early access to new albums' },
  { icon: 'live-tv',           threshold: 3,  reward: 'Exclusive live session invite' },
  { icon: 'workspace-premium', threshold: 10, reward: 'Premium member badge' },
];

const REWARD_TIER_PALETTE = [
  { color: 'primary', surface: 'primarySurface', border: 'primaryBorder' },
  { color: 'info', surface: 'infoSurface', border: 'infoBorder' },
  { color: 'warning', surface: 'warningSurface', border: 'warningBorder' },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CodeDisplay({ code, isCopied, onCopy }: { code: string; isCopied: boolean; onCopy: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <View style={styles.codeCenterWrap}>
      <TVTouchable onPress={onCopy} showFocusBorder={false} style={styles.codePill}>
        <CustomText style={styles.codeText}>{code}</CustomText>
        <MaterialIcons
          name={isCopied ? 'check-circle' : 'content-copy'}
          size={20}
          color={isCopied ? theme.colors.success : theme.colors.primary}
        />
      </TVTouchable>
      <CustomText style={isCopied ? styles.codeCopiedText : styles.codeMutedText}>
        {isCopied ? 'Copied to clipboard!' : 'Tap to copy your code'}
      </CustomText>
    </View>
  );
}


// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReferralScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { code, referralCount, shareCount, isLoading, share, copyCode, isCopied } = useReferral();
  const { config } = useMobileAppConfig();

  const howItWorks = useMemo(() => {
    const configured = config?.referral?.howItWorks;
    return configured?.length ? configured : DEFAULT_HOW_IT_WORKS;
  }, [config]);

  const rewards = useMemo(() => {
    const configured = config?.referral?.rewardTiers;
    const tiers = configured?.length ? configured : DEFAULT_REWARD_TIERS;
    return tiers.map((tier, idx) => ({
      icon: tier.icon,
      color: theme.colors[REWARD_TIER_PALETTE[idx % REWARD_TIER_PALETTE.length]!.color],
      surface: theme.colors[REWARD_TIER_PALETTE[idx % REWARD_TIER_PALETTE.length]!.surface],
      border: theme.colors[REWARD_TIER_PALETTE[idx % REWARD_TIER_PALETTE.length]!.border],
      threshold: tier.threshold,
      label: `${tier.threshold} referral${tier.threshold === 1 ? '' : 's'}`,
      reward: tier.reward,
    }));
  }, [config, theme]);

  return (
    <PremiumPage title="Invite Friends" eyebrow="Share the experience" subtitle="A clear, tracked invitation flow">
      <SurfaceCard tone="strong" style={styles.intro}>
        <CustomText variant="caption" style={styles.eyebrow}>Guest-first invitations</CustomText>
        <CustomText variant="display">Worship is better when it is shared.</CustomText>
        <CustomText variant="body" style={styles.introBody}>Send a secure invitation to friends and family. They can begin with guest access, while eligible joins are attributed by the backend.</CustomText>
        <View style={styles.metricsRow}>
          <View style={styles.metric}><CustomText style={styles.metricValue}>{shareCount}</CustomText><CustomText variant="caption" style={styles.metricLabel}>Invites shared</CustomText></View>
          <View style={styles.metric}><CustomText style={styles.metricValue}>{referralCount}</CustomText><CustomText variant="caption" style={styles.metricLabel}>Friends joined</CustomText></View>
        </View>
        <View style={styles.progress}>{[true, shareCount > 0, referralCount > 0].map((active, index) => <View key={index} style={[styles.progressStep, active && styles.progressActive]} />)}</View>
      </SurfaceCard>
      {isLoading ? (
        <SurfaceCard tone="strong" style={styles.loadingPad}>
          <ActivityIndicator color={theme.colors.primary} />
          <CustomText variant="body" style={styles.cardDescription}>Preparing your secure invitation…</CustomText>
        </SurfaceCard>
      ) : code ? (
        <SurfaceCard tone="strong" style={styles.codePadCard}>
          <View style={styles.codeHeader}><View style={styles.codeIcon}><MaterialIcons name="link" size={20} color={theme.colors.primary} /></View><View style={styles.codeHeaderCopy}><CustomText variant="heading" style={styles.codeHeading}>Your invitation code</CustomText><CustomText variant="caption" style={styles.codeBody}>Issued and tracked securely by ClaudyGod</CustomText></View></View>
          <CodeDisplay code={code} isCopied={isCopied} onCopy={copyCode} />
          <AppButton
            title="Share your invite link"
            variant="gradient"
            size="lg"
            fullWidth
            onPress={() => void share()}
            leftIcon={<MaterialIcons name="share" size={18} color={theme.colors.onPrimary} />}
            style={styles.shareBtn}
          />
        </SurfaceCard>
      ) : null}

        <SurfaceCard tone="subtle" style={styles.stepsPad}>
          <CustomText variant="heading" style={styles.cardTitle}>2. How it works</CustomText>
          <CustomText variant="body" style={styles.cardDescription}>A simple path from sharing to verified attribution.</CustomText>
          {howItWorks.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepIconBox}>
                <MaterialIcons name={step.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={17} color={theme.colors.primary} />
              </View>
              <View style={styles.stepBody}>
                <CustomText style={styles.stepTitle}>{step.title}</CustomText>
                <CustomText style={styles.stepDesc}>{step.body}</CustomText>
              </View>
            </View>
          ))}
        </SurfaceCard>

      <SurfaceCard tone="strong" style={styles.rewardsPad}>
        <CustomText variant="heading" style={styles.cardTitle}>3. Reward progress</CustomText>
        <CustomText variant="body" style={styles.cardDescription}>Benefits unlock only after the backend confirms eligible joins.</CustomText>
        <View style={styles.rewardsList}>
          {rewards.map((reward) => (
            <SurfaceCard key={reward.label} tone="subtle" style={styles.rewardCard}>
              <View style={[styles.rewardIconBox, { backgroundColor: reward.surface, borderColor: reward.border }]}>
                <MaterialIcons name={reward.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={20} color={reward.color} />
              </View>
              <View style={styles.rewardTextWrap}>
                <CustomText style={styles.rewardTier}>{reward.label}</CustomText>
                <CustomText style={styles.rewardName}>{reward.reward}</CustomText>
              </View>
              <MaterialIcons name={referralCount >= reward.threshold ? 'check-circle' : 'lock-outline'} size={17} color={referralCount >= reward.threshold ? theme.colors.success : theme.colors.textMuted} />
            </SurfaceCard>
          ))}
        </View>
      </SurfaceCard>
    </PremiumPage>
  );
}
