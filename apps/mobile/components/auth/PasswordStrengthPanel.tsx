import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { getPasswordStrengthReport } from '../../lib/authValidation';

interface PasswordStrengthPanelProps {
  password: string;
}

export function PasswordStrengthPanel({ password }: PasswordStrengthPanelProps) {
  const report = getPasswordStrengthReport(password);

  const palette =
    report.tone === 'error'
      ? { accent: '#FF7B7B', surface: 'rgba(255,80,80,0.08)', text: '#FFD8D8' }
      : report.tone === 'warning'
        ? { accent: '#FBBF24', surface: 'rgba(251,191,36,0.10)', text: '#FFEDB6' }
        : report.tone === 'success'
          ? { accent: '#51D08B', surface: 'rgba(81,208,139,0.10)', text: '#D9FFE8' }
          : { accent: '#8AA8FF', surface: 'rgba(110,132,255,0.10)', text: '#DFE6FF' };

  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 14,
        paddingVertical: 13,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View>
          <CustomText variant="caption" style={{ color: 'rgba(226,219,242,0.74)' }}>
            Password strength
          </CustomText>
          <CustomText variant="label" style={{ color: palette.text, marginTop: 4 }}>
            {report.label}
          </CustomText>
        </View>

        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <CustomText variant="caption" style={{ color: palette.text }}>
            {report.percentage}%
          </CustomText>
        </View>
      </View>

      <View
        style={{
          marginTop: 10,
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${report.percentage}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: palette.accent,
          }}
        />
      </View>

      <View style={{ gap: 7, marginTop: 12 }}>
        {report.checks.map((check) => (
          <View
            key={check.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MaterialIcons
              name={check.passed ? 'check-circle' : check.recommended ? 'radio-button-unchecked' : 'cancel'}
              size={16}
              color={check.passed ? palette.accent : check.recommended ? 'rgba(202,196,220,0.66)' : '#FF9E9E'}
            />
            <CustomText
              variant="caption"
              style={{
                color: check.passed ? 'rgba(233,240,255,0.92)' : 'rgba(202,196,220,0.74)',
                flex: 1,
              }}
            >
              {check.label}
            </CustomText>
          </View>
        ))}
      </View>
    </View>
  );
}
