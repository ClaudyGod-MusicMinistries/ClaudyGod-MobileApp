import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { getPasswordStrengthReport } from '../../features/auth/authValidation';
import { makeStyles } from '../../styles/makeStyles';
import { useAppTheme } from '../../util/colorScheme';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  wrap: {
    borderRadius: 18, borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.subtleFill,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  strengthLabel:  { color: theme.colors.textSecondary },
  percentPillBase: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  progressTrack: {
    marginTop: 10, height: 6, borderRadius: 999,
    backgroundColor: theme.colors.subtleFillMed, overflow: 'hidden',
  },
  progressFillBase: { height: '100%', borderRadius: 999 },
  checksGap: { gap: 7, marginTop: 12 },
  checkRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkTextBase: { flex: 1 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface PasswordStrengthPanelProps {
  password: string;
}

export function PasswordStrengthPanel({ password }: PasswordStrengthPanelProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const report = getPasswordStrengthReport(password);

  const palette =
    report.tone === 'error'
      ? { accent: theme.colors.danger, surface: theme.colors.dangerSurface, text: theme.colors.danger }
      : report.tone === 'warning'
        ? { accent: theme.colors.warning, surface: theme.colors.warningSurface, text: theme.colors.warning }
        : report.tone === 'success'
          ? { accent: theme.colors.success, surface: theme.colors.successSurface, text: theme.colors.success }
          : { accent: theme.colors.info, surface: theme.colors.infoSurface, text: theme.colors.info };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View>
          <CustomText variant="caption" style={styles.strengthLabel}>
            Password strength
          </CustomText>
          <CustomText variant="label" style={{ color: palette.text, marginTop: 4 }}>
            {report.label}
          </CustomText>
        </View>

        <View style={[styles.percentPillBase, { backgroundColor: palette.surface }]}>
          <CustomText variant="caption" style={{ color: palette.text }}>
            {report.percentage}%
          </CustomText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFillBase,
            { width: `${report.percentage}%`, backgroundColor: palette.accent },
          ]}
        />
      </View>

      <View style={styles.checksGap}>
        {report.checks.map((check) => (
          <View key={check.id} style={styles.checkRow}>
            <MaterialIcons
              name={check.passed ? 'check-circle' : check.recommended ? 'radio-button-unchecked' : 'cancel'}
              size={16}
              color={check.passed ? palette.accent : check.recommended ? theme.colors.textMuted : theme.colors.danger}
            />
            <CustomText
              variant="caption"
              style={[styles.checkTextBase, { color: check.passed ? theme.colors.text : theme.colors.textSecondary }]}
            >
              {check.label}
            </CustomText>
          </View>
        ))}
      </View>
    </View>
  );
}
