import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Modal, TextInput, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
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

  type ActionModalKey =
    | 'password'
    | 'export'
    | 'reset'
    | 'delete'
    | 'profile'
    | 'history'
    | 'downloads'
    | 'diagnostics'
    | null;

  const [activeModal, setActiveModal] = useState<ActionModalKey>(null);
  const [deleteFullName, setDeleteFullName] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const openActionModal = useCallback((key: Exclude<ActionModalKey, null>) => setActiveModal(key), []);
  const closeActionModal = useCallback(() => {
    setActiveModal(null);
    setDeleteFullName('');
    setDeleteConfirmText('');
  }, []);

  const deletePhrase = 'I CONFIRM';
  const canSubmitDelete =
    deleteFullName.trim().length >= 3 &&
    deleteConfirmText.trim().toUpperCase() === deletePhrase;

  const submitDeleteRequest = useCallback(() => {
    if (!canSubmitDelete) return;
    closeActionModal();
    Alert.alert(
      'Delete request prepared',
      'Your confirmation has been captured. Connect your backend workflow to submit the deletion request.',
    );
  }, [canSubmitDelete, closeActionModal]);

  const activeModalConfig = useMemo<ActionModalConfig | null>(() => {
    switch (activeModal) {
      case 'password':
        return {
          key: 'password',
          title: 'Password & Sign-in',
          description:
            'Use this section to update your password, review active sessions, and recover access if you forget your password.',
          bullets: [
            'Use “Forgot Password” on the sign-in screen if you cannot access your account.',
            'Update your password regularly to protect your account.',
            'Session management can be connected here when backend auth is ready.',
          ],
          primaryActionLabel: 'Open Sign-in',
          onPrimaryAction: () => {
            closeActionModal();
            router.push('/sign-in');
          },
          secondaryActionLabel: 'Close',
          onSecondaryAction: closeActionModal,
        };
      case 'export':
        return {
          key: 'export',
          title: 'Export My Data',
          description:
            'This request will generate a downloadable copy of your account profile, library, and activity records when the backend workflow is connected.',
          bullets: [
            'Exports are usually sent to your account email.',
            'Large accounts may take longer to prepare.',
            'You can review privacy support before submitting an export.',
          ],
          primaryActionLabel: 'Contact Support',
          onPrimaryAction: () => {
            closeActionModal();
            void Linking.openURL('mailto:privacy@claudygodmusic.com');
          },
          secondaryActionLabel: 'Close',
          onSecondaryAction: closeActionModal,
        };
      case 'reset':
        return {
          key: 'reset',
          title: 'Reset Recommendations',
          description:
            'Resetting recommendations clears personalization signals and rebuilds suggestions from new activity.',
          bullets: [
            'Your profile and saved content remain unchanged.',
            'Video and audio suggestions may look generic until new activity is recorded.',
            'This will be enabled when recommendation services are connected.',
          ],
          primaryActionLabel: 'Understood',
          onPrimaryAction: closeActionModal,
          secondaryActionLabel: 'Close',
          onSecondaryAction: closeActionModal,
        };
      case 'delete':
        return {
          key: 'delete',
          title: 'Delete Account',
          description:
            'This action is permanent. To confirm authorization, enter your full name and type “I CONFIRM” exactly.',
          danger: true,
          primaryActionLabel: 'Submit Request',
          onPrimaryAction: submitDeleteRequest,
          secondaryActionLabel: 'Cancel',
          onSecondaryAction: closeActionModal,
          customContent: (
            <View style={{ marginTop: 12 }}>
              <DeleteConfirmationFields
                fullName={deleteFullName}
                onChangeFullName={setDeleteFullName}
                confirmText={deleteConfirmText}
                onChangeConfirmText={setDeleteConfirmText}
                confirmPhrase={deletePhrase}
              />
            </View>
          ),
          disablePrimaryAction: !canSubmitDelete,
        };
      case 'profile':
        return {
          key: 'profile',
          title: 'Profile Details',
          description:
            'Update your name, email, phone number, and other account profile details from your Profile screen.',
          bullets: [
            'Profile updates help keep account recovery and notifications accurate.',
            'Changes can be saved locally now and connected to backend sync later.',
          ],
          primaryActionLabel: 'Open Profile',
          onPrimaryAction: () => {
            closeActionModal();
            router.push('/profile');
          },
          secondaryActionLabel: 'Close',
          onSecondaryAction: closeActionModal,
        };
      case 'history':
        return {
          key: 'history',
          title: 'Playback History',
          description:
            'Playback history is used for resume playback and personalized recommendations. You can reset it when connected.',
          bullets: [
            'Resetting history removes personalization signals, not your saved playlists.',
            'Resume positions may be cleared for previously watched content.',
          ],
          primaryActionLabel: 'Close',
          onPrimaryAction: closeActionModal,
        };
      case 'downloads':
        return {
          key: 'downloads',
          title: 'Offline Downloads',
          description:
            'Manage downloaded videos and audio files from your Library. Storage controls can be connected here.',
          bullets: [
            'Remove offline media to free up space on this device.',
            'Downloads are device-specific unless cloud sync is enabled.',
          ],
          primaryActionLabel: 'Open Library',
          onPrimaryAction: () => {
            closeActionModal();
            router.push('/(tabs)/Favourites');
          },
          secondaryActionLabel: 'Close',
          onSecondaryAction: closeActionModal,
        };
      case 'diagnostics':
        return {
          key: 'diagnostics',
          title: 'Diagnostics',
          description:
            'Diagnostics help improve app stability by reporting crash and performance information when enabled.',
          bullets: [
            'Diagnostics do not affect your saved media.',
            'You can choose whether to participate when backend settings are connected.',
          ],
          primaryActionLabel: 'Close',
          onPrimaryAction: closeActionModal,
        };
      default:
        return null;
    }
  }, [
    activeModal,
    canSubmitDelete,
    closeActionModal,
    deleteConfirmText,
    deleteFullName,
    router,
    submitDeleteRequest,
  ]);

  const securityActions = [
    {
      icon: 'password',
      title: 'Password & Sign-in',
      subtitle: 'Update password, sessions, and recovery options',
      onPress: () => openActionModal('password'),
      emphasis: 'neutral' as const,
    },
    {
      icon: 'download',
      title: 'Export my data',
      subtitle: 'Request account, library, and playback export',
      onPress: () => openActionModal('export'),
      emphasis: 'primary' as const,
    },
    {
      icon: 'history-toggle-off',
      title: 'Reset recommendations',
      subtitle: 'Clear personalization history and rebuild suggestions',
      onPress: () => openActionModal('reset'),
      emphasis: 'neutral' as const,
    },
    {
      icon: 'delete-outline',
      title: 'Delete account',
      subtitle: 'Permanent deletion request with data purge workflow',
      onPress: () => openActionModal('delete'),
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
      onPress: () => openActionModal('password'),
      tone: 'neutral' as const,
    },
    {
      icon: 'download' as const,
      label: 'Export',
      onPress: () => openActionModal('export'),
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
      onPress: () => openActionModal('delete'),
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
                onPress={() => {
                  if (item.title === 'Profile details') return openActionModal('profile');
                  if (item.title === 'Playback history') return openActionModal('history');
                  if (item.title === 'Offline downloads') return openActionModal('downloads');
                  return openActionModal('diagnostics');
                }}
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

      <PrivacyActionModal
        visible={Boolean(activeModalConfig)}
        config={activeModalConfig}
        onClose={closeActionModal}
      />
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
  onPress,
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
  onPress?: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      disabled={!onPress}
      showFocusBorder={false}
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
          {onPress ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                Manage
              </CustomText>
              <MaterialIcons name="chevron-right" size={16} color={theme.colors.primary} style={{ marginLeft: 2 }} />
            </View>
          ) : null}
        </View>
      </View>
    </TVTouchable>
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

type ActionModalConfig = {
  key: string;
  title: string;
  description: string;
  bullets?: string[];
  customContent?: React.ReactNode;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  disablePrimaryAction?: boolean;
  danger?: boolean;
};

function PrivacyActionModal({
  visible,
  config,
  onClose,
}: {
  visible: boolean;
  config: ActionModalConfig | null;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  if (!config) {
    return null;
  }

  const ui = {
    backdrop: 'rgba(5,4,10,0.72)',
    cardBg: isDark ? 'rgba(14,11,23,0.98)' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    muted: isDark ? 'rgba(190,181,216,0.92)' : theme.colors.text.secondary,
    softBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    softBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
    primaryBg: config.danger ? (isDark ? 'rgba(220,38,38,0.92)' : '#DC2626') : theme.colors.primary,
    primaryText: '#FFFFFF',
    secondaryBg: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surface,
    secondaryBorder: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border,
    secondaryText: theme.colors.text.primary,
  } as const;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: ui.backdrop,
          justifyContent: 'center',
          paddingHorizontal: 18,
          paddingVertical: 24,
        }}
      >
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: ui.cardBorder,
            backgroundColor: ui.cardBg,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                {config.title}
              </CustomText>
              <CustomText variant="caption" style={{ color: ui.muted, marginTop: 5 }}>
                {config.description}
              </CustomText>
            </View>
            <TVTouchable
              onPress={onClose}
              showFocusBorder={false}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: ui.secondaryBorder,
                backgroundColor: ui.secondaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="close" size={18} color={theme.colors.text.primary} />
            </TVTouchable>
          </View>

          {config.bullets?.length ? (
            <View style={{ marginTop: 12, gap: 7 }}>
              {config.bullets.map((bullet) => (
                <View
                  key={bullet}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: ui.softBorder,
                    backgroundColor: ui.softBg,
                    paddingHorizontal: 10,
                    paddingVertical: 9,
                  }}
                >
                  <MaterialIcons name="check-circle" size={15} color={theme.colors.primary} style={{ marginTop: 1 }} />
                  <CustomText variant="caption" style={{ color: ui.muted, marginLeft: 8, flex: 1 }}>
                    {bullet}
                  </CustomText>
                </View>
              ))}
            </View>
          ) : null}

          {config.customContent}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {config.secondaryActionLabel && config.onSecondaryAction ? (
              <TVTouchable
                onPress={config.onSecondaryAction}
                showFocusBorder={false}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: ui.secondaryBorder,
                  backgroundColor: ui.secondaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CustomText variant="label" style={{ color: ui.secondaryText }}>
                  {config.secondaryActionLabel}
                </CustomText>
              </TVTouchable>
            ) : null}

            <TVTouchable
              onPress={config.onPrimaryAction}
              disabled={config.disablePrimaryAction}
              hasTVPreferredFocus
              showFocusBorder={false}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: config.disablePrimaryAction ? ui.secondaryBorder : ui.primaryBg,
                backgroundColor: config.disablePrimaryAction ? ui.secondaryBg : ui.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: config.disablePrimaryAction ? 0.6 : 1,
              }}
            >
              <CustomText variant="label" style={{ color: config.disablePrimaryAction ? ui.secondaryText : ui.primaryText }}>
                {config.primaryActionLabel}
              </CustomText>
            </TVTouchable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteConfirmationFields({
  fullName,
  onChangeFullName,
  confirmText,
  onChangeConfirmText,
  confirmPhrase,
}: {
  fullName: string;
  onChangeFullName: (_value: string) => void;
  confirmText: string;
  onChangeConfirmText: (_value: string) => void;
  confirmPhrase: string;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border;
  const bg = isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt;

  return (
    <View style={{ gap: 10 }}>
      <View>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginBottom: 5 }}>
          Full name
        </CustomText>
        <TextInput
          value={fullName}
          onChangeText={onChangeFullName}
          placeholder="Enter your full name"
          placeholderTextColor={isDark ? 'rgba(190,181,216,0.7)' : 'rgba(108,99,134,0.8)'}
          style={{
            minHeight: 42,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: bg,
            paddingHorizontal: 12,
            color: theme.colors.text.primary,
          }}
        />
      </View>

      <View>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginBottom: 5 }}>
          Confirmation phrase
        </CustomText>
        <TextInput
          value={confirmText}
          onChangeText={onChangeConfirmText}
          autoCapitalize="characters"
          placeholder={confirmPhrase}
          placeholderTextColor={isDark ? 'rgba(190,181,216,0.7)' : 'rgba(108,99,134,0.8)'}
          style={{
            minHeight: 42,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: bg,
            paddingHorizontal: 12,
            color: theme.colors.text.primary,
          }}
        />
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 5 }}>
          Type “{confirmPhrase}” exactly to authorize this request.
        </CustomText>
      </View>
    </View>
  );
}
