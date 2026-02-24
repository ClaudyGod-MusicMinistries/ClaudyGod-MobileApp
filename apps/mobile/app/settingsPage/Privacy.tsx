import React from 'react';
import { Alert, Linking, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';

const dataPolicies = [
  {
    icon: 'person-outline',
    title: 'Account profile',
    description: 'Name and email for authentication, support, and account recovery.',
    retention: 'Until account deletion',
  },
  {
    icon: 'history',
    title: 'Playback history',
    description: 'Resume playback, most-played analytics, and personalized rails.',
    retention: 'User-controlled',
  },
  {
    icon: 'download',
    title: 'Offline metadata',
    description: 'Local download indexes and sync state across signed-in devices.',
    retention: 'While downloads exist',
  },
  {
    icon: 'bug-report',
    title: 'Diagnostics',
    description: 'Crash and performance telemetry to improve app stability.',
    retention: 'Rolling window',
  },
] as const;

const privacyPrinciples = [
  'We do not sell personal data.',
  'Security controls are available from inside the app.',
  'Privacy requests are processed by a human support team.',
  'Activity-based personalization can be reset by the user.',
] as const;

export default function Privacy() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const ui = {
    heroBg: isDark ? 'rgba(12,9,20,0.9)' : theme.colors.surface,
    heroBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    heroSoft: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    heroSoftBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
    iconBadgeBg: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
    iconBadgeBorder: isDark ? 'rgba(216,194,255,0.24)' : 'rgba(109,40,217,0.14)',
    successBg: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)',
    successBorder: isDark ? 'rgba(134,239,172,0.2)' : 'rgba(22,163,74,0.14)',
    successText: isDark ? '#BBF7D0' : '#166534',
    warningBg: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.08)',
    warningBorder: isDark ? 'rgba(253,224,71,0.18)' : 'rgba(245,158,11,0.14)',
    warningText: isDark ? '#FDE68A' : '#92400E',
    rowSoft: isDark ? 'rgba(255,255,255,0.02)' : theme.colors.surfaceAlt,
    rowSoftBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.06)',
  } as const;

  const handlePlaceholder = (label: string) => {
    Alert.alert(label, 'This action is ready for backend wiring (Supabase/Auth/Admin workflow).');
  };

  const securityActions = [
    {
      icon: 'password',
      title: 'Password & Sign-in',
      subtitle: 'Update password, sessions, and recovery options',
      onPress: () => handlePlaceholder('Password & Sign-in'),
      emphasis: 'neutral' as const,
    },
    {
      icon: 'download',
      title: 'Export my data',
      subtitle: 'Request account, library, and playback export',
      onPress: () => handlePlaceholder('Export my data'),
      emphasis: 'primary' as const,
    },
    {
      icon: 'history-toggle-off',
      title: 'Reset recommendations',
      subtitle: 'Clear personalization history and rebuild suggestions',
      onPress: () => handlePlaceholder('Reset recommendations'),
      emphasis: 'neutral' as const,
    },
    {
      icon: 'delete-outline',
      title: 'Delete account',
      subtitle: 'Permanent deletion request with data purge workflow',
      onPress: () => handlePlaceholder('Delete account'),
      emphasis: 'danger' as const,
    },
  ] as {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    title: string;
    subtitle: string;
    onPress: () => void;
    emphasis: 'neutral' | 'primary' | 'danger';
  }[];

  return (
    <SettingsScaffold
      title="Privacy & Security"
      subtitle="Controls, policy clarity, and account protection"
      hero={
        <FadeIn>
          <SurfaceCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: ui.heroBorder,
                backgroundColor: ui.heroBg,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ui.iconBadgeBg,
                    borderWidth: 1,
                    borderColor: ui.iconBadgeBorder,
                    marginRight: 10,
                  }}
                >
                  <MaterialIcons name="shield" size={22} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    Trust Center
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                    Enterprise-style privacy controls with clear user actions and transparent processing.
                  </CustomText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <StatusPill
                  icon="lock-outline"
                  label="Encrypted"
                  tone="success"
                  ui={ui}
                />
                <StatusPill
                  icon="verified-user"
                  label="Account Controls"
                  tone="success"
                  ui={ui}
                />
                <StatusPill
                  icon="policy"
                  label="Data Requests"
                  tone="warning"
                  ui={ui}
                />
              </View>

              <View style={{ marginTop: 14, gap: 8 }}>
                <View style={{ flexDirection: compact ? 'column' : 'row', gap: 8 }}>
                  <AppButton
                    title="Export Data"
                    variant="outline"
                    fullWidth
                    onPress={() => handlePlaceholder('Export Data')}
                    leftIcon={<MaterialIcons name="download" size={16} color={theme.colors.primary} />}
                  />
                  <AppButton
                    title="Privacy Email"
                    variant="ghost"
                    fullWidth
                    onPress={() => void Linking.openURL('mailto:privacy@claudygodmusic.com')}
                    style={{
                      borderWidth: 1,
                      borderColor: ui.heroSoftBorder,
                      backgroundColor: ui.heroSoft,
                    }}
                    textColor={theme.colors.text.primary}
                    leftIcon={<MaterialIcons name="email" size={16} color={theme.colors.primary} />}
                  />
                </View>
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={80}>
        <SectionCard
          title="Security Controls"
          subtitle="Fast actions for access, export, recommendation reset, and deletion requests."
        >
          <View style={{ gap: 8 }}>
            {securityActions.map((item) => (
              <SecurityActionRow
                key={item.title}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                emphasis={item.emphasis}
              />
            ))}
          </View>
        </SectionCard>
      </FadeIn>

      <FadeIn delay={130}>
        <SectionCard
          title="Data We Process"
          subtitle="What is collected, why it is used, and how long it is generally retained."
          style={{ marginTop: spacing.sm }}
        >
          <View style={{ gap: 8 }}>
            {dataPolicies.map((item) => (
              <DataPolicyRow
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                retention={item.retention}
                ui={ui}
              />
            ))}
          </View>
        </SectionCard>
      </FadeIn>

      <FadeIn delay={180}>
        <SectionCard
          title="Privacy Principles"
          subtitle="Simple commitments we follow when handling user data."
          style={{ marginTop: spacing.sm }}
        >
          <View style={{ gap: 8 }}>
            {privacyPrinciples.map((item) => (
              <View
                key={item}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: ui.rowSoftBorder,
                  backgroundColor: ui.rowSoft,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
              >
                <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} style={{ marginTop: 1 }} />
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginLeft: 8, flex: 1 }}>
                  {item}
                </CustomText>
              </View>
            ))}
          </View>
        </SectionCard>
      </FadeIn>

      <FadeIn delay={230}>
        <TVTouchable
          onPress={() => void Linking.openURL('mailto:privacy@claudygodmusic.com')}
          showFocusBorder={false}
          style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}
        >
          <SurfaceCard tone="subtle" style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ui.iconBadgeBg,
                  marginRight: 10,
                }}
              >
                <MaterialIcons name="support-agent" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  Privacy Support
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  Email `privacy@claudygodmusic.com` for exports, corrections, or account deletion requests.
                </CustomText>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
            </View>
          </SurfaceCard>
        </TVTouchable>
      </FadeIn>
    </SettingsScaffold>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  style?: object;
}) {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={[{ padding: spacing.md }, style]}>
      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4, marginBottom: 10 }}>
        {subtitle}
      </CustomText>
      {children}
    </SurfaceCard>
  );
}

function SecurityActionRow({
  icon,
  title,
  subtitle,
  onPress,
  emphasis,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  emphasis: 'neutral' | 'primary' | 'danger';
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  const accent =
    emphasis === 'danger'
      ? { icon: isDark ? '#FCA5A5' : '#B91C1C', bg: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)' }
      : emphasis === 'primary'
      ? { icon: theme.colors.primary, bg: isDark ? 'rgba(154,107,255,0.1)' : 'rgba(109,40,217,0.06)' }
      : { icon: theme.colors.primary, bg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt };

  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : theme.colors.surface,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent.bg,
          marginRight: 10,
        }}
      >
        <MaterialIcons name={icon} size={18} color={accent.icon} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
          {subtitle}
        </CustomText>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
    </TVTouchable>
  );
}

function DataPolicyRow({
  icon,
  title,
  description,
  retention,
  ui,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description: string;
  retention: string;
  ui: {
    rowSoft: string;
    rowSoftBorder: string;
    iconBadgeBg: string;
    iconBadgeBorder: string;
  };
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: ui.rowSoftBorder,
        backgroundColor: ui.rowSoft,
        padding: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ui.iconBadgeBg,
            borderWidth: 1,
            borderColor: ui.iconBadgeBorder,
            marginRight: 10,
          }}
        >
          <MaterialIcons name={icon} size={17} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CustomText variant="label" style={{ color: theme.colors.text.primary, flex: 1, marginRight: 8 }}>
              {title}
            </CustomText>
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                {retention}
              </CustomText>
            </View>
          </View>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            {description}
          </CustomText>
        </View>
      </View>
    </View>
  );
}

function StatusPill({
  icon,
  label,
  tone,
  ui,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  tone: 'success' | 'warning';
  ui: {
    successBg: string;
    successBorder: string;
    successText: string;
    warningBg: string;
    warningBorder: string;
    warningText: string;
  };
}) {
  const palette = tone === 'success'
    ? { bg: ui.successBg, border: ui.successBorder, text: ui.successText }
    : { bg: ui.warningBg, border: ui.warningBorder, text: ui.warningText };

  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <MaterialIcons name={icon} size={14} color={palette.text} />
      <CustomText variant="caption" style={{ color: palette.text, marginLeft: 6 }}>
        {label}
      </CustomText>
    </View>
  );
}
