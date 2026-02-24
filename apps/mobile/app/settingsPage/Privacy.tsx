import React from 'react';
import { Alert, Linking, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';

const dataPolicies = [
  {
    icon: 'person-outline',
    title: 'Profile details',
    description: 'Manage your name and email used for sign-in, support, and account recovery.',
    retention: 'Editable',
  },
  {
    icon: 'history',
    title: 'Playback history',
    description: 'Reset watch and listening history to refresh recommendations when needed.',
    retention: 'Reset anytime',
  },
  {
    icon: 'download',
    title: 'Offline downloads',
    description: 'Control downloaded media and remove saved items from this device.',
    retention: 'Device only',
  },
  {
    icon: 'bug-report',
    title: 'Diagnostics',
    description: 'Optional app diagnostics help improve playback and reliability.',
    retention: 'Optional',
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

  const ui = {
    heroBg: isDark ? 'rgba(12,9,20,0.9)' : theme.colors.surface,
    heroBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    iconBadgeBg: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
    iconBadgeBorder: isDark ? 'rgba(216,194,255,0.24)' : 'rgba(109,40,217,0.14)',
    rowSoft: isDark ? 'rgba(255,255,255,0.02)' : theme.colors.surfaceAlt,
    rowSoftBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.06)',
  } as const;

  const handlePlaceholder = (label: string) => {
    Alert.alert(label, 'This action will be available soon.');
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

  const quickActions = [
    {
      icon: 'password' as const,
      label: 'Password',
      onPress: () => handlePlaceholder('Password & Sign-in'),
      tone: 'neutral' as const,
    },
    {
      icon: 'download' as const,
      label: 'Export',
      onPress: () => handlePlaceholder('Export Data'),
      tone: 'primary' as const,
    },
    {
      icon: 'email' as const,
      label: 'Contact',
      onPress: () => void Linking.openURL('mailto:privacy@claudygodmusic.com'),
      tone: 'neutral' as const,
    },
    {
      icon: 'delete-outline' as const,
      label: 'Delete',
      onPress: () => handlePlaceholder('Delete account'),
      tone: 'danger' as const,
    },
  ];

  return (
    <SettingsScaffold
      title="Privacy & Security"
      subtitle="Controls, policy clarity, and account protection"
      hero={
        <FadeIn>
          <SurfaceCard style={{ padding: spacing.md, marginBottom: spacing.lg }}>
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
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ui.iconBadgeBg,
                    borderWidth: 1,
                    borderColor: ui.iconBadgeBorder,
                    marginRight: 10,
                  }}
                >
                  <MaterialIcons name="shield" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    Privacy Controls
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
                    Manage sign-in, exports, support, and account actions.
                  </CustomText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 10 }}>
                {quickActions.map((item) => (
                  <View key={item.label} style={{ width: width >= 768 ? '25%' : '50%', paddingHorizontal: 4, marginBottom: 8 }}>
                    <QuickActionTile icon={item.icon} label={item.label} onPress={item.onPress} tone={item.tone} />
                  </View>
                ))}
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={80}>
        <SectionCard
          title="Security & Account"
          subtitle="Manage sign-in access, exports, recommendations, and deletion requests."
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
          title="Privacy Preferences"
          subtitle="Review and manage the areas of your account and activity you can control."
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
          title="Privacy Commitments"
          subtitle="Simple commitments for security, privacy, and user choice."
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
                  Contact Privacy Support
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  Email `privacy@claudygodmusic.com` for help with exports, corrections, or account requests.
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

function QuickActionTile({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  tone: 'neutral' | 'primary' | 'danger';
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const palette =
    tone === 'danger'
      ? {
          bg: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.05)',
          border: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(220,38,38,0.1)',
          icon: isDark ? '#FCA5A5' : '#B91C1C',
          text: isDark ? '#FDE2E2' : '#991B1B',
        }
      : tone === 'primary'
      ? {
          bg: isDark ? 'rgba(154,107,255,0.12)' : 'rgba(109,40,217,0.06)',
          border: isDark ? 'rgba(216,194,255,0.16)' : 'rgba(109,40,217,0.1)',
          icon: isDark ? '#EDE3FF' : theme.colors.primary,
          text: isDark ? '#F3ECFF' : '#4C1D95',
        }
      : {
          bg: isDark ? 'rgba(255,255,255,0.02)' : theme.colors.surfaceAlt,
          border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
          icon: theme.colors.primary,
          text: theme.colors.text.primary,
        };

  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
      style={{
        minHeight: 72,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        paddingHorizontal: 10,
        paddingVertical: 9,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.04)',
        }}
      >
        <MaterialIcons name={icon} size={16} color={palette.icon} />
      </View>
      <CustomText variant="caption" style={{ color: palette.text, marginTop: 8 }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}
