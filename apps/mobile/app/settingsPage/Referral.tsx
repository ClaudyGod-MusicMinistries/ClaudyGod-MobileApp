import React from 'react';
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // CodeDisplay
  codeCenterWrap:  { alignItems: 'center', paddingVertical: 24, gap: 12 },
  codePill: {
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5, borderColor: theme.colors.primaryBorder,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28,
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


  // Hero card
  heroCard:        { overflow: 'hidden' },
  heroPad:         { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 4 },
  heroTopRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  heroIconBox: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge:       { color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle:       { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginTop: 1 },
  heroBody:        { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  countStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: theme.colors.primarySurface,
    borderTopWidth: 1, borderTopColor: theme.colors.primaryBorder,
  },
  countText:       { color: theme.colors.text, fontSize: 13, fontWeight: '600' },

  // Cards padding
  loadingPad:      { padding: 40, alignItems: 'center' },
  codePadCard:     { paddingHorizontal: 20, paddingBottom: 20 },

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

const HOW_IT_WORKS = [
  { step: '1', icon: 'share' as const,        title: 'Share your link',    body: 'Send your unique referral link to friends and family.' },
  { step: '2', icon: 'person-add' as const,   title: 'Friend joins free',  body: 'They create a free ClaudyGod account — no payment needed.' },
  { step: '3', icon: 'stars' as const,        title: 'Both of you benefit', body: 'You both unlock early access to exclusive worship content.' },
] as const;

function getRewards(theme: ReturnType<typeof useAppTheme>) {
  return [
    { icon: 'library-music' as const,       color: theme.colors.primary, label: '1 referral',   reward: 'Early access to new albums' },
    { icon: 'live-tv' as const,             color: theme.colors.info,    label: '3 referrals',  reward: 'Exclusive live session invite' },
    { icon: 'workspace-premium' as const,   color: theme.colors.warning, label: '10 referrals', reward: 'Premium member badge' },
  ];
}

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
  const { code, referralCount, isLoading, share, copyCode, isCopied } = useReferral();

  return (
    <SettingsScaffold
      title="Invite Friends"
      subtitle="Share ClaudyGod and unlock rewards together"
      icon="card-giftcard"
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.heroCard}>
            <View style={styles.heroPad}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconBox}>
                  <MaterialIcons name="card-giftcard" size={18} color={theme.colors.primary} />
                </View>
                <View>
                  <CustomText style={styles.heroBadge}>Referral Program</CustomText>
                  <CustomText style={styles.heroTitle}>Invite &amp; earn rewards</CustomText>
                </View>
              </View>
              <CustomText style={styles.heroBody}>
                Share ClaudyGod with the people in your life. Every friend you invite gets free access — and you both unlock exclusive rewards.
              </CustomText>
            </View>

            <View style={styles.countStrip}>
              <MaterialIcons name="group" size={16} color={theme.colors.primary} />
              <CustomText style={styles.countText}>
                {referralCount === 0
                  ? 'No referrals yet — start sharing!'
                  : `${referralCount} friend${referralCount === 1 ? '' : 's'} joined through your link`}
              </CustomText>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {isLoading ? (
        <SurfaceCard tone="strong" style={styles.loadingPad}>
          <ActivityIndicator color={theme.colors.primary} />
        </SurfaceCard>
      ) : code ? (
        <SurfaceCard tone="strong" style={styles.codePadCard}>
          <CodeDisplay code={code} isCopied={isCopied} onCopy={copyCode} />
          <AppButton
            title="Share your invite link"
            size="lg"
            fullWidth
            onPress={() => void share()}
            leftIcon={<MaterialIcons name="share" size={18} color="#FFFFFF" />}
            style={styles.shareBtn}
          />
        </SurfaceCard>
      ) : null}

      <View style={styles.howGap}>
        <SectionLabel title="How it works" accent="Simple" />
        <SurfaceCard tone="subtle" style={styles.stepsPad}>
          {HOW_IT_WORKS.map((step) => (
            <View key={step.step} style={styles.stepRow}>
              <View style={styles.stepIconBox}>
                <MaterialIcons name={step.icon} size={17} color={theme.colors.primary} />
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
          {getRewards(theme).map((reward) => (
            <SurfaceCard key={reward.label} tone="subtle" style={styles.rewardCard}>
              <View style={[styles.rewardIconBox, { backgroundColor: `${reward.color}16`, borderColor: `${reward.color}28` }]}>
                <MaterialIcons name={reward.icon} size={20} color={reward.color} />
              </View>
              <View style={styles.rewardTextWrap}>
                <CustomText style={styles.rewardTier}>{reward.label}</CustomText>
                <CustomText style={styles.rewardName}>{reward.reward}</CustomText>
              </View>
              <MaterialIcons name="lock-outline" size={16} color={theme.colors.textMuted} />
            </SurfaceCard>
          ))}
        </View>
      </View>
    </SettingsScaffold>
  );
}
