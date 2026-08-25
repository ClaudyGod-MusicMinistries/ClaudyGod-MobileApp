import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';
import { useAppTheme } from '../../util/colorScheme';

interface AuthFeedbackBannerProps {
  message: string;
  tone?: 'error' | 'success' | 'info';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles(() => ({
  bannerBase: {
    marginTop: 12, borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 13, paddingVertical: 11,
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthFeedbackBanner({
  message,
  tone = 'info',
}: AuthFeedbackBannerProps) {
  const styles = useStyles();
  const theme = useAppTheme();

  const palette =
    tone === 'error'
      ? { borderColor: theme.colors.dangerBorder, backgroundColor: theme.colors.dangerSurface, textColor: theme.colors.danger }
      : tone === 'success'
        ? { borderColor: theme.colors.successBorder, backgroundColor: theme.colors.successSurface, textColor: theme.colors.success }
        : { borderColor: theme.colors.infoBorder, backgroundColor: theme.colors.infoSurface, textColor: theme.colors.info };

  return (
    <View style={[styles.bannerBase, { borderColor: palette.borderColor, backgroundColor: palette.backgroundColor }]}>
      <CustomText variant="caption" style={{ color: palette.textColor }}>
        {message}
      </CustomText>
    </View>
  );
}
