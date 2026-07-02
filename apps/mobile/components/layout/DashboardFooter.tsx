import React from 'react';
import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { SurfaceCard } from '../ui/SurfaceCard';
import { AppButton } from '../ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  root:           { marginTop: theme.spacing.xl, marginBottom: theme.spacing.xxl, gap: theme.spacing.lg },

  // Header copy block
  headerWrap:     { alignItems: 'center', gap: 6 },
  headerEyebrow:  { color: theme.colors.textSecondary, letterSpacing: 0.9 },
  headerTitle:    { color: theme.colors.text },
  headerBody:     { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 },

  // Cards container
  cardsGap:       { gap: theme.spacing.md },

  // Shared card layout
  cardPad:        { padding: theme.spacing.lg },
  cardRow:        { flexDirection: 'row', gap: 14, alignItems: 'center' },
  cardTextFill:   { flex: 1 },
  cardTitle:      { color: theme.colors.text },
  cardSubtitle:   { color: theme.colors.textSecondary },
  cardBtnWrap:    { marginTop: theme.spacing.md },

  // Icon boxes
  donateIconBox: {
    width: 46, height: 46, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(109,40,217,0.14)',
    borderWidth: 1, borderColor: 'rgba(109,40,217,0.24)',
  },
  alertIconBox: {
    width: 46, height: 46, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },

  // Feedback row
  feedbackRow: {
    paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  feedbackLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackText:   { color: theme.colors.text },

  // Footer copyright
  copyright:      { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardFooterProps {
  onSupportPress?: () => void;
  onLiveAlertsPress?: () => void;
  onFeedbackPress?: () => void;
}

export function DashboardFooter({
  onSupportPress,
  onLiveAlertsPress,
  onFeedbackPress,
}: DashboardFooterProps) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <CustomText variant="label" style={styles.headerEyebrow}>STAY CONNECTED</CustomText>
        <CustomText variant="heading" style={styles.headerTitle}>Support and stay in the loop</CustomText>
        <CustomText variant="caption" style={styles.headerBody}>
          Get live updates, share feedback, and keep the ministry moving forward.
        </CustomText>
      </View>

      <View style={styles.cardsGap}>
        <SurfaceCard tone="strong" style={styles.cardPad}>
          <View style={styles.cardRow}>
            <View style={styles.donateIconBox}>
              <MaterialIcons name="favorite" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.cardTextFill}>
              <CustomText variant="subtitle" style={styles.cardTitle}>Support the ministry</CustomText>
              <CustomText variant="caption" style={styles.cardSubtitle}>Give once or set a daily, weekly, or monthly plan.</CustomText>
            </View>
          </View>
          <View style={styles.cardBtnWrap}>
            <AppButton
              title="Support now"
              onPress={onSupportPress}
              leftIcon={<MaterialIcons name="arrow-forward" size={16} color={theme.colors.textInverse} />}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard tone="subtle" style={styles.cardPad}>
          <View style={styles.cardRow}>
            <View style={styles.alertIconBox}>
              <MaterialIcons name="notifications-active" size={22} color={theme.colors.success} />
            </View>
            <View style={styles.cardTextFill}>
              <CustomText variant="subtitle" style={styles.cardTitle}>Live alerts</CustomText>
              <CustomText variant="caption" style={styles.cardSubtitle}>Be the first to know when we go live.</CustomText>
            </View>
          </View>
          <View style={styles.cardBtnWrap}>
            <AppButton
              title="Notify me"
              variant="secondary"
              onPress={onLiveAlertsPress}
              leftIcon={<MaterialIcons name="notifications" size={16} color={theme.colors.text} />}
            />
          </View>
        </SurfaceCard>
      </View>

      <Pressable onPress={onFeedbackPress} style={styles.feedbackRow}>
        <View style={styles.feedbackLeft}>
          <MaterialIcons name="forum" size={18} color={theme.colors.primary} />
          <CustomText variant="body" style={styles.feedbackText}>Send feedback or prayer requests</CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <CustomText variant="caption" style={styles.copyright}>
        © 2026 ClaudyGod. All rights reserved.
      </CustomText>
    </View>
  );
}
