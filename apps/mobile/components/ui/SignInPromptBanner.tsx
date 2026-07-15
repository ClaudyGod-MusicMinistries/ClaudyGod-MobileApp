import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { SurfaceCard } from './SurfaceCard';
import { useUserAccount } from '../../context/UserAccountContext';
import { useAccountSheet } from '../../context/AccountSheetContext';
import { getPreference, setPreference } from '../../lib/localUserStorage';

const DISMISS_KEY = 'signInBannerDismissedAt';
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // reappears after 3 days, not gone forever

const useStyles = makeStyles((theme) => ({
  card:      { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainRow:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
  },
  textFill:  { flex: 1, minWidth: 0 },
  title:     { color: theme.colors.text },
  message:   { color: theme.colors.textSecondary, marginTop: 2 },
  dismissBtn:{ padding: 4 },
}));

// AccountSheet (context/AccountSheetContext.tsx) already has a complete,
// working sign-in/sign-up/Google flow — it just had exactly one entry point
// (a small button buried in Settings). This gives it a second, more visible
// one wherever it's placed, without duplicating any auth logic.
export function SignInPromptBanner({ message }: { message?: string }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { isSignedIn } = useUserAccount();
  const { openAccountSheet } = useAccountSheet();
  const [dismissed, setDismissed] = useState(true); // hidden until the dismissal check below resolves, to avoid a flash

  useEffect(() => {
    let active = true;
    void getPreference<number>(DISMISS_KEY, 0).then((dismissedAt) => {
      if (active) setDismissed(Date.now() - dismissedAt < DISMISS_COOLDOWN_MS);
    });
    return () => {
      active = false;
    };
  }, []);

  if (isSignedIn || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    void setPreference(DISMISS_KEY, Date.now());
  };

  return (
    <SurfaceCard tone="subtle" style={styles.card}>
      <TVTouchable onPress={openAccountSheet} showFocusBorder={false} style={styles.mainRow}>
        <View style={styles.iconBox}>
          <MaterialIcons name="sync" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.textFill}>
          <CustomText variant="label" style={styles.title}>Sign in to unlock more</CustomText>
          <CustomText variant="caption" style={styles.message} numberOfLines={2}>
            {message ?? 'Sync your favourites and history, and get picks based on what you actually play.'}
          </CustomText>
        </View>
      </TVTouchable>
      <TVTouchable onPress={dismiss} showFocusBorder={false} style={styles.dismissBtn}>
        <MaterialIcons name="close" size={18} color={theme.colors.textMuted} />
      </TVTouchable>
    </SurfaceCard>
  );
}
