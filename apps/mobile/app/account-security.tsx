import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SettingsScaffold } from '../components/layout/SettingsScaffold';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { AppButton } from '../components/ui/AppButton';
import { ActionSheet } from '../components/ui/ActionSheet';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';
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

export default function AccountSecurity() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; action?: string }>();
  const isAuthorized = useRequireMobileSession();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loadingAction, setLoadingAction] = useState<PendingAction>(null);
  const [message, setMessage] = useState('');

  const token = typeof params.token === 'string' ? params.token : '';
  const hasEmailChangeToken = params.action === 'confirm-email-change' && token.length > 0;
  const canRequestEmailChange = useMemo(
    () => newEmail.trim().includes('@') && currentPassword.length >= 8,
    [currentPassword, newEmail],
  );
  const canRequestPasswordChange = currentPassword.length >= 8;

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  const runEmailChangeRequest = async () => {
    setLoadingAction('email');
    setMessage('');
    try {
      const response = await requestEmailChange({
        newEmail: newEmail.trim().toLowerCase(),
        currentPassword,
      });
      setNewEmail('');
      setCurrentPassword('');
      setMessage(response.message);
      showToast({ title: 'Check your email', message: response.message, tone: 'success' });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to start email change.';
      setMessage(nextMessage);
      showToast({ title: 'Action needed', message: nextMessage, tone: 'error' });
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
      const nextMessage = error instanceof Error ? error.message : 'Unable to start password change.';
      setMessage(nextMessage);
      showToast({ title: 'Action needed', message: nextMessage, tone: 'error' });
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
      const nextMessage = error instanceof Error ? error.message : 'Unable to confirm email change.';
      setMessage(nextMessage);
      showToast({ title: 'Action needed', message: nextMessage, tone: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <SettingsScaffold
      title="Account security"
      subtitle="Confirm sensitive changes through your email before anything is updated."
      backRoute={APP_ROUTES.profile}
    >
      <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg, gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.14)' : 'rgba(124,58,237,0.10)',
            }}
          >
            <MaterialIcons name="shield" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText variant="title" style={{ color: theme.colors.text }}>
              Signed in as {user?.displayName ?? 'your account'}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
              {user?.email}
            </CustomText>
          </View>
        </View>
      </SurfaceCard>

      {hasEmailChangeToken ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Confirm email change
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
            This action updates the account email and closes active sessions. You will sign in again after confirmation.
          </CustomText>
          <AppButton
            title={loadingAction === 'confirm-token' ? 'Confirming...' : 'Confirm secure change'}
            fullWidth
            disabled={loadingAction !== null}
            onPress={() => setPendingAction('confirm-token')}
            leftIcon={<MaterialIcons name="verified-user" size={18} color={theme.colors.textInverse} />}
          />
        </SurfaceCard>
      ) : null}

      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <CustomText variant="heading" style={{ color: theme.colors.text }}>
          Change email
        </CustomText>
        <SecureInput label="New email address" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
        <SecureInput label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <AppButton
          title={loadingAction === 'email' ? 'Sending...' : 'Send confirmation link'}
          fullWidth
          disabled={!canRequestEmailChange || loadingAction !== null}
          onPress={() => setPendingAction('email')}
          leftIcon={<MaterialIcons name="mark-email-read" size={18} color={theme.colors.textInverse} />}
        />
      </SurfaceCard>

      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <CustomText variant="heading" style={{ color: theme.colors.text }}>
          Change password
        </CustomText>
        <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
          Confirm your current password first. We will email a secure password change link to your account address.
        </CustomText>
        <SecureInput label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <AppButton
          title={loadingAction === 'password' ? 'Sending...' : 'Send password link'}
          variant="secondary"
          fullWidth
          disabled={!canRequestPasswordChange || loadingAction !== null}
          onPress={() => setPendingAction('password')}
          leftIcon={<MaterialIcons name="lock-reset" size={18} color={theme.colors.text} />}
        />
      </SurfaceCard>

      {message ? (
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.md, textAlign: 'center' }}>
          {message}
        </CustomText>
      ) : null}

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

function SecureInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (_value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 7 }}>
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.2 }}>
        {label}
      </CustomText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.colors.textSecondary}
        style={{
          minHeight: 48,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
          color: theme.colors.text,
          paddingHorizontal: 14,
          fontSize: 14,
        }}
      />
    </View>
  );
}
