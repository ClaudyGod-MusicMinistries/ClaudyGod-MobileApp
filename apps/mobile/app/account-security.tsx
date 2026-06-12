import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { SettingsScaffold } from '../components/layout/SettingsScaffold';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { AppButton } from '../components/ui/AppButton';
import { ActionSheet } from '../components/ui/ActionSheet';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';
import { useDeviceClass } from '../util/deviceClassConfig';
import { APP_ROUTES } from '../util/appRoutes';
import { useRequireMobileSession } from '../hooks/useRequireMobileSession';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { clearMobileSession } from '../services/authService';
import {
  confirmEmailChange,
  requestEmailChange,
  requestPasswordChange,
} from '../services/accountSecurityService';

type PendingAction = 'email' | 'password' | 'confirm-token' | null;

const SECURITY_TIPS = [
  { icon: 'lock' as const,           tip: 'Use a password with at least 8 characters including uppercase, lowercase, and a number.' },
  { icon: 'email' as const,          tip: 'Keep your account email current so you can always recover access.' },
  { icon: 'verified-user' as const,  tip: 'All sensitive changes are confirmed via your registered email for your protection.' },
];

function SecureField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (_v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, fontSize: 11 }}>
        {label}
      </CustomText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          minHeight: 50, borderRadius: theme.radius.lg, borderWidth: 1,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
          color: theme.colors.text, paddingHorizontal: 14, fontSize: 14,
        }}
      />
    </View>
  );
}

function SectionHeader({ icon, title, description, color }: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description: string;
  color: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}18` }}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant="heading" style={{ color: theme.colors.text }}>{title}</CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3, lineHeight: 17 }}>{description}</CustomText>
      </View>
    </View>
  );
}

export default function AccountSecurity() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const params = useLocalSearchParams<{ token?: string; action?: string }>();
  const isAuthorized = useRequireMobileSession();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [newEmail, setNewEmail]               = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingAction, setPendingAction]     = useState<PendingAction>(null);
  const [loadingAction, setLoadingAction]     = useState<PendingAction>(null);
  const [message, setMessage]                 = useState('');

  const token = typeof params.token === 'string' ? params.token : '';
  const hasEmailChangeToken = params.action === 'confirm-email-change' && token.length > 0;
  const canRequestEmailChange = useMemo(
    () => newEmail.trim().includes('@') && currentPassword.length >= 8,
    [currentPassword, newEmail],
  );
  const canRequestPasswordChange = currentPassword.length >= 8;
  const isTwoCol = device.isDesktop || device.isTV;

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  const runEmailChangeRequest = async () => {
    setLoadingAction('email');
    setMessage('');
    try {
      const response = await requestEmailChange({ newEmail: newEmail.trim().toLowerCase(), currentPassword });
      setNewEmail('');
      setCurrentPassword('');
      setMessage(response.message);
      showToast({ title: 'Check your email', message: response.message, tone: 'success' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to start email change.';
      setMessage(msg);
      showToast({ title: 'Action needed', message: msg, tone: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const runPasswordChangeRequest = async () => {
    setLoadingAction('password');
    setMessage('');
    try {
      const response = await requestPasswordChange(currentPassword);
      setCurrentPassword('');
      setMessage(response.message);
      showToast({ title: 'Check your email', message: response.message, tone: 'success' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to start password change.';
      setMessage(msg);
      showToast({ title: 'Action needed', message: msg, tone: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const runTokenConfirmation = async () => {
    setLoadingAction('confirm-token');
    setMessage('');
    try {
      const response = await confirmEmailChange(token);
      showToast({ title: 'Email updated', message: response.message, tone: 'success' });
      await clearMobileSession();
      router.replace(APP_ROUTES.auth.signIn);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to confirm email change.';
      setMessage(msg);
      showToast({ title: 'Action needed', message: msg, tone: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <SettingsScaffold
      title="Account security"
      subtitle="Confirm sensitive changes through your email before anything is updated."
      backRoute={APP_ROUTES.profile}
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(251,191,36,0.10)', 'rgba(251,191,36,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, pointerEvents: 'none' }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(251,191,36,0.14)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.28)' }}>
                <MaterialIcons name="shield" size={26} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="caption" style={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  Protected account
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 2 }}>
                  {user?.displayName ?? 'Your account'}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
                  {user?.email}
                </CustomText>
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {/* Pending token confirmation */}
      {hasEmailChangeToken ? (
        <FadeIn>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: 14, borderColor: theme.colors.primary, borderWidth: 1, marginBottom: theme.spacing.md }}>
            <SectionHeader icon="mark-email-read" title="Confirm email change" description="This updates your account email and closes active sessions. You will sign in again after confirmation." color={theme.colors.primary} />
            <AppButton
              title={loadingAction === 'confirm-token' ? 'Confirming...' : 'Confirm secure change'}
              fullWidth
              disabled={loadingAction !== null}
              onPress={() => setPendingAction('confirm-token')}
              leftIcon={<MaterialIcons name="verified-user" size={18} color={theme.colors.textInverse} />}
            />
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {/* Two-column on desktop/TV */}
      <FadeIn delay={80}>
        <View style={{ flexDirection: isTwoCol ? 'row' : 'column', gap: 14, alignItems: 'flex-start' }}>
          {/* Change email */}
          <SurfaceCard tone="subtle" style={{ flex: 1, padding: theme.spacing.lg, gap: 14 }}>
            <SectionHeader
              icon="email"
              title="Change email"
              description="Enter your new email and current password. A confirmation link will be sent."
              color="#60A5FA"
            />
            <SecureField label="New email address" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" placeholder="new@example.com" />
            <SecureField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Your current password" />
            <AppButton
              title={loadingAction === 'email' ? 'Sending...' : 'Send confirmation link'}
              fullWidth
              disabled={!canRequestEmailChange || loadingAction !== null}
              loading={loadingAction === 'email'}
              onPress={() => setPendingAction('email')}
              leftIcon={<MaterialIcons name="mark-email-read" size={18} color={theme.colors.textInverse} />}
            />
          </SurfaceCard>

          {/* Change password */}
          <SurfaceCard tone="subtle" style={{ flex: 1, padding: theme.spacing.lg, gap: 14 }}>
            <SectionHeader
              icon="lock-reset"
              title="Change password"
              description="Verify your current password first. A secure reset link will be emailed to your account."
              color="#B794F6"
            />
            <SecureField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Your current password" />
            <AppButton
              title={loadingAction === 'password' ? 'Sending...' : 'Send password link'}
              variant="secondary"
              fullWidth
              disabled={!canRequestPasswordChange || loadingAction !== null}
              loading={loadingAction === 'password'}
              onPress={() => setPendingAction('password')}
              leftIcon={<MaterialIcons name="lock-reset" size={18} color={theme.colors.text} />}
            />
          </SurfaceCard>
        </View>
      </FadeIn>

      {/* Feedback message */}
      {message ? (
        <FadeIn delay={100}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <MaterialIcons name="info-outline" size={18} color={theme.colors.primary} style={{ marginTop: 1 }} />
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, flex: 1, lineHeight: 18 }}>
              {message}
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {/* Security tips */}
      <FadeIn delay={130}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md, gap: 12 }}>
          <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
            Security tips
          </CustomText>
          {SECURITY_TIPS.map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}12`, marginTop: 1 }}>
                <MaterialIcons name={tip.icon} size={15} color={theme.colors.primary} />
              </View>
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary, flex: 1, lineHeight: 18 }}>
                {tip.tip}
              </CustomText>
            </View>
          ))}
        </SurfaceCard>
      </FadeIn>

      <ActionSheet
        visible={pendingAction !== null}
        title="Confirm secure request"
        description="For your protection, this request is verified by password and completed through your email. Continue only if you started it."
        actions={[
          {
            key: 'continue',
            label: 'Continue',
            detail: 'Send or confirm the protected account action.',
            icon: 'verified-user',
            tone: 'accent',
            onPress: () => {
              const action = pendingAction;
              setPendingAction(null);
              if (action === 'email') void runEmailChangeRequest();
              if (action === 'password') void runPasswordChangeRequest();
              if (action === 'confirm-token') void runTokenConfirmation();
            },
          },
        ]}
        onClose={() => setPendingAction(null)}
      />
    </SettingsScaffold>
  );
}