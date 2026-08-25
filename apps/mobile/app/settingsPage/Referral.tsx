import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { SectionLabel } from '../../components/feed';
import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useReferral } from '../../hooks/useReferral';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { PremiumSettingsHero } from '../../components/layout/PremiumSettingsHero';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
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


  metricsRow: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, padding: 13, borderRadius: 16, backgroundColor: theme.colors.subtleFill, borderWidth: 1, borderColor: theme.colors.border },
  metricValue: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  metricLabel: { color: theme.colors.textSecondary, marginTop: 2 },

  // Cards padding
  loadingPad:      { padding: 40, alignItems: 'center' },
  codePadCard:     { padding: 20 },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  codeHeaderCopy: { flex: 1 },
  codeHeading: { color: theme.colors.text },
  codeBody: { color: theme.colors.textSecondary, marginTop: 3 },

  // How it works
  howGap:          { gap: 12 },
  stepsPad:        { paddingHorizontal: 20, paddingVertical: 16, gap: 18 },
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
  rewardsGap:      { gap: 12 },
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

const REWARD_TIER_PALETTE_KEYS = ['primary', 'info', 'warning'] as const;

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
      color: theme.colors[REWARD_TIER_PALETTE_KEYS[idx % REWARD_TIER_PALETTE_KEYS.length]!],
      threshold: tier.threshold,
      label: `${tier.threshold} referral${tier.threshold === 1 ? '' : 's'}`,
      reward: tier.reward,
    }));
  }, [config, theme]);

  return (
    <SettingsScaffold
      title="Invite Friends"
      subtitle="Share ClaudyGod and unlock rewards together"
      icon="card-giftcard"
      hero={
        <FadeIn>
          <PremiumSettingsHero eyebrow="Share the experience" kicker="Invite friends" title="Worship is better when it is shared." description="Send a secure ClaudyGod invitation to friends and family. They can begin with guest access, while eligible joins are attributed by the backend." badge="No sign-in required to share" badgeIcon="verified-user">
            <View style={styles.metricsRow}>
              <View style={styles.metric}><CustomText style={styles.metricValue}>{shareCount}</CustomText><CustomText variant="caption" style={styles.metricLabel}>Invites shared</CustomText></View>
              <View style={styles.metric}><CustomText style={styles.metricValue}>{referralCount}</CustomText><CustomText variant="caption" style={styles.metricLabel}>Friends joined</CustomText></View>
            </View>
          </PremiumSettingsHero>
        </FadeIn>
      }
    >
      {isLoading ? (
        <SurfaceCard tone="strong" style={styles.loadingPad}>
          <ActivityIndicator color={theme.colors.primary} />
        </SurfaceCard>
      ) : code ? (
        <SurfaceCard tone="strong" style={styles.codePadCard}>
          <View style={styles.codeHeader}><View style={styles.codeIcon}><MaterialIcons name="link" size={20} color={theme.colors.primary} /></View><View style={styles.codeHeaderCopy}><CustomText variant="heading" style={styles.codeHeading}>Your invitation code</CustomText><CustomText variant="caption" style={styles.codeBody}>Issued and tracked securely by ClaudyGod</CustomText></View></View>
          <CodeDisplay code={code} isCopied={isCopied} onCopy={copyCode} />
          <AppButton
            title="Share your invite link"
            size="lg"
            fullWidth
            onPress={() => void share()}
            leftIcon={<MaterialIcons name="share" size={18} color={theme.colors.onPrimary} />}
            style={styles.shareBtn}
          />
        </SurfaceCard>
      ) : null}

      <View style={styles.howGap}>
        <SectionLabel title="How it works" accent="Simple" />
        <SurfaceCard tone="subtle" style={styles.stepsPad}>
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
      </View>

      <View style={styles.rewardsGap}>
        <SectionLabel title="Rewards" accent="Unlock" subtitle="More friends = more benefits" />
        <View style={styles.rewardsList}>
          {rewards.map((reward) => (
            <SurfaceCard key={reward.label} tone="subtle" style={styles.rewardCard}>
              <View style={[styles.rewardIconBox, { backgroundColor: `${reward.color}16`, borderColor: `${reward.color}28` }]}>
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
      </View>
    </SettingsScaffold>
  );
}
