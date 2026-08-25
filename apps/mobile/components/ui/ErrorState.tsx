import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { AppButton } from './AppButton';
import { FadeIn } from './FadeIn';
import { SurfaceCard } from './SurfaceCard';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  title?: string;
  variant?: 'page' | 'inline';
  retryLabel?: string;
  supportingText?: string;
};

const useStyles = makeStyles((theme) => ({
  pageCard: { minHeight: 280, padding: theme.spacing.xl, justifyContent: 'center', gap: 14 },
  inlineCard: { padding: theme.spacing.lg, gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.dangerSurface, borderWidth: 1, borderColor: theme.colors.dangerBorder },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { color: theme.colors.danger, textTransform: 'uppercase', letterSpacing: 0.9 },
  title: { color: theme.colors.text, marginTop: 2 },
  message: { color: theme.colors.textSecondary, lineHeight: 21 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 14, backgroundColor: theme.colors.subtleFill, borderWidth: 1, borderColor: theme.colors.border },
  noticeText: { flex: 1, color: theme.colors.textMuted, lineHeight: 18 },
}));

export function ErrorState({ message, onRetry, title, variant = 'inline', retryLabel = 'Try again', supportingText }: ErrorStateProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const isPage = variant === 'page';
  return (
    <FadeIn replayKey={`${variant}:${message}`} from={6} duration={280}>
      <SurfaceCard tone={isPage ? 'strong' : 'subtle'} style={isPage ? styles.pageCard : styles.inlineCard} accessibilityLiveRegion="polite">
        <View style={styles.headingRow}>
          <View style={styles.iconBox}><MaterialIcons name={isPage ? 'cloud-off' : 'error-outline'} size={isPage ? 25 : 21} color={theme.colors.danger} /></View>
          <View style={styles.copy}>
            <CustomText variant="caption" style={styles.eyebrow}>{isPage ? 'Connection interrupted' : 'Unable to refresh'}</CustomText>
            <CustomText variant={isPage ? 'display' : 'heading'} style={styles.title}>{title ?? (isPage ? 'Content could not be loaded' : 'Couldn’t load this')}</CustomText>
          </View>
        </View>
        <CustomText variant="body" style={styles.message}>{message}</CustomText>
        {supportingText ? <View style={styles.notice}><MaterialIcons name="info-outline" size={17} color={theme.colors.textMuted} /><CustomText variant="caption" style={styles.noticeText}>{supportingText}</CustomText></View> : null}
        <AppButton title={retryLabel} variant={isPage ? 'gradient' : 'secondary'} size={isPage ? 'lg' : 'md'} fullWidth onPress={onRetry} />
      </SurfaceCard>
    </FadeIn>
  );
}
