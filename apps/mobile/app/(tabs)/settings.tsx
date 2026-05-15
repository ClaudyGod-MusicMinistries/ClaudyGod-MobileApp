import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAuth } from '../../context/AuthContext';
import { useAppModal } from '../../context/AppModalContext';
import { useAppTheme, useThemeContext } from '../../util/colorScheme';
import { fetchMePreferences, updateMePreferences } from '../../services/userFlowService';
import { clearMobileSession } from '../../services/authService';
import { APP_ROUTES } from '../../util/appRoutes';
import { EmptyState, PremiumPage, QuickActionGrid } from '../../components/Exp/PremiumContent';

type ThemePreference = 'system' | 'light' | 'dark';

type SettingItem = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  hint?: string;
  value: boolean;
  onToggle: (_value: boolean) => void;
};

function SettingRow({ item }: { item: SettingItem }) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={() => item.onToggle(!item.value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
      }}
      showFocusBorder={false}
      accessibilityRole="switch"
      accessibilityState={{ checked: item.value }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            theme.scheme === 'dark'
              ? 'rgba(183,148,246,0.12)'
              : 'rgba(124,58,237,0.08)',
        }}
      >
        <MaterialIcons name={item.icon} size={19} color={theme.colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text }}>
          {item.label}
        </CustomText>

        {item.hint ? (
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textSecondary,
              marginTop: 4,
              lineHeight: 16,
            }}
          >
            {item.hint}
          </CustomText>
        ) : null}
      </View>

      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        thumbColor={theme.colors.textInverse}
        trackColor={{
          false: theme.colors.border,
          true: `${theme.colors.primary}88`,
        }}
        ios_backgroundColor={theme.colors.border}
      />
    </TVTouchable>
  );
}

function AppearanceModePicker({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (_value: ThemePreference) => void;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const stack = width < 420;

  const options: {
    value: ThemePreference;
    label: string;
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
  }[] = [
    { value: 'system', label: 'System', icon: 'devices' },
    { value: 'light', label: 'Light', icon: 'light-mode' },
    { value: 'dark', label: 'Dark', icon: 'dark-mode' },
  ];

  return (
    <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
      <CustomText
        variant="caption"
        style={{
          color: theme.colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.9,
        }}
      >
        Appearance
      </CustomText>

      <CustomText
        variant="heading"
        style={{
          color: theme.colors.text,
          marginTop: 6,
        }}
      >
        Choose your viewing style
      </CustomText>

      <CustomText
        variant="body"
        style={{
          color: theme.colors.textSecondary,
          marginTop: 6,
        }}
      >
        Use a calm interface that fits your device and environment.
      </CustomText>

      <View
        style={{
          flexDirection: stack ? 'column' : 'row',
          gap: 10,
          marginTop: 16,
        }}
      >
        {options.map((option) => {
          const active = value === option.value;

          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1,
                minHeight: 58,
                borderRadius: theme.radius.xl,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.borderStrong,
                backgroundColor: active
                  ? theme.scheme === 'dark'
                    ? 'rgba(183,148,246,0.18)'
                    : 'rgba(124,58,237,0.10)'
                  : theme.scheme === 'dark'
                    ? 'rgba(255,255,255,0.055)'
                    : 'rgba(19,12,33,0.035)',
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
              showFocusBorder={false}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <MaterialIcons
                name={option.icon}
                size={19}
                color={active ? theme.colors.primary : theme.colors.text}
              />

              <CustomText
                variant="label"
                style={{
                  color: theme.colors.text,
                }}
              >
                {option.label}
              </CustomText>
            </TVTouchable>
          );
        })}
      </View>
    </SurfaceCard>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { themePreference, setThemePreference } = useThemeContext();
  const router = useRouter();
  const { showModal } = useAppModal();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [personalization, setPersonalization] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      if (!isAuthenticated) {
        setPreferencesLoaded(true);
        return;
      }

      try {
        const response = await fetchMePreferences();

        if (!active) return;

        setNotifications(response.preferences.notificationsEnabled);
        setAutoPlay(response.preferences.autoplayEnabled);
        setHighQuality(response.preferences.highQualityEnabled);
        setPersonalization(response.preferences.personalizationEnabled);
      } catch {
        // Keep defaults if preferences are unavailable.
      }

      if (active) {
        setPreferencesLoaded(true);
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const persistPreferencePatch = useCallback(
    (patch: Partial<Parameters<typeof updateMePreferences>[0]>) => {
      if (!preferencesLoaded || !isAuthenticated) return;

      void updateMePreferences(patch).catch(() => undefined);
    },
    [isAuthenticated, preferencesLoaded],
  );

  const controlSections = useMemo(
    () => [
      {
        title: 'Playback',
        items: [
          {
            icon: 'play-circle-outline' as const,
            label: 'Auto-play',
            hint: 'Continue to the next song or message automatically.',
            value: autoPlay,
            onToggle: (value: boolean) => {
              setAutoPlay(value);
              persistPreferencePatch({ autoplayEnabled: value });
              showModal({ title: 'Playback updated', message: value ? 'Auto-play is on.' : 'Auto-play is off.', tone: 'info', icon: 'play-circle-outline' });
            },
          },
          {
            icon: 'high-quality' as const,
            label: 'High quality audio',
            hint: 'Use more data for richer listening when available.',
            value: highQuality,
            onToggle: (value: boolean) => {
              setHighQuality(value);
              persistPreferencePatch({ highQualityEnabled: value });
              showModal({ title: 'Audio quality updated', message: value ? 'Higher quality audio is enabled.' : 'Standard quality audio is enabled.', tone: 'info', icon: 'high-quality' });
            },
          },
        ],
      },
      {
        title: 'Experience',
        items: [
          {
            icon: 'notifications-none' as const,
            label: 'Notifications',
            hint: 'Receive live alerts and release reminders.',
            value: notifications,
            onToggle: (value: boolean) => {
              setNotifications(value);
              persistPreferencePatch({ notificationsEnabled: value });
              showModal({ title: 'Notifications updated', message: value ? 'Alerts are on.' : 'Alerts are off.', tone: 'info', icon: 'notifications-none' });
            },
          },
          {
            icon: 'auto-awesome' as const,
            label: 'Recommendations',
            hint: 'Use listening activity to improve suggestions.',
            value: personalization,
            onToggle: (value: boolean) => {
              setPersonalization(value);
              persistPreferencePatch({ personalizationEnabled: value });
              showModal({ title: 'Recommendations updated', message: value ? 'Recommendations are personalized.' : 'Personalization is off.', tone: 'info', icon: 'auto-awesome' });
            },
          },
        ],
      },
    ],
    [
      autoPlay,
      highQuality,
      notifications,
      personalization,
      persistPreferencePatch,
      showModal,
    ],
  );

  const handleLogout = async () => {
    try {
      await clearMobileSession();
    } catch {
      // Still move the user out of the protected area if local cleanup partially fails.
    }

    showModal({
      title: 'Signed out',
      message: 'You can sign in again anytime.',
      tone: 'info',
      icon: 'logout',
    });

    router.replace(APP_ROUTES.landing);
  };

  const handleAppearanceChange = (value: ThemePreference) => {
    setThemePreference(value);
    persistPreferencePatch({ themePreference: value });

    showModal({
      title: 'Appearance updated',
      message: value === 'system' ? 'Using your device setting.' : `Using ${value} mode.`,
      tone: 'success',
      icon: 'palette',
    });
  };

  return (
    <PremiumPage
      title="Settings"
      eyebrow="Your app"
      rightAction={
        <AppButton
          title=""
          variant="secondary"
          size="sm"
          onPress={() => router.push(APP_ROUTES.tabs.home)}
          style={{ minWidth: 40, paddingHorizontal: 10 }}
          leftIcon={
            <MaterialIcons name="home-filled" size={16} color={theme.colors.text} />
          }
        />
      }
    >
      <QuickActionGrid
        actions={[
          {
            label: 'Profile',
            hint: isAuthenticated ? 'Account details' : 'Sign in required',
            icon: isAuthenticated ? 'person-outline' : 'lock-outline',
            onPress: () => router.push(isAuthenticated ? APP_ROUTES.profile : APP_ROUTES.auth.signIn),
          },
          {
            label: 'Library',
            hint: isAuthenticated ? 'Saved content' : 'Sign in to save',
            icon: isAuthenticated ? 'library-music' : 'lock-outline',
            onPress: () => router.push(APP_ROUTES.tabs.library),
          },
          {
            label: 'Help',
            hint: 'Get support',
            icon: 'help-outline',
            onPress: () => router.push(APP_ROUTES.settingsPages.help),
          },
          {
            label: 'Support',
            hint: 'Give or donate',
            icon: 'volunteer-activism',
            onPress: () => router.push(APP_ROUTES.settingsPages.donate),
          },
        ]}
      />

      <AppearanceModePicker value={themePreference} onChange={handleAppearanceChange} />

      {controlSections.map((section) => (
        <SurfaceCard
          key={section.title}
          tone="subtle"
          style={{
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 4,
          }}
        >
          <View style={{ paddingTop: 12, paddingBottom: 4 }}>
            <CustomText
              variant="caption"
              style={{
                color: theme.colors.primary,
                textTransform: 'uppercase',
                letterSpacing: 0.9,
              }}
            >
              {section.title}
            </CustomText>
          </View>

          {section.items.map((item, index) => (
            <View
              key={`${section.title}-${item.label}`}
              style={{
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <SettingRow item={item} />
            </View>
          ))}
        </SurfaceCard>
      ))}

      <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
        <CustomText variant="heading" style={{ color: theme.colors.text }}>
          {isAuthenticated ? 'Account' : 'Sign in for personal features'}
        </CustomText>

        <CustomText
          variant="body"
          style={{
            color: theme.colors.textSecondary,
            marginTop: 6,
          }}
        >
          {isAuthenticated
            ? 'Sign out safely when you are done using this device.'
            : 'Create an account or sign in to save favorites, sync library, and keep settings across devices.'}
        </CustomText>

        <AppButton
          title={isAuthenticated ? 'Sign out' : 'Sign in'}
          variant={isAuthenticated ? 'outline' : 'primary'}
          onPress={() => (isAuthenticated ? void handleLogout() : router.push(APP_ROUTES.auth.signIn))}
          style={{
            marginTop: 14,
            borderColor: isAuthenticated ? theme.colors.danger : theme.colors.primary,
          }}
          textColor={isAuthenticated ? theme.colors.danger : theme.colors.textInverse}
          leftIcon={
            <MaterialIcons
              name={isAuthenticated ? 'logout' : 'login'}
              size={17}
              color={isAuthenticated ? theme.colors.danger : theme.colors.textInverse}
            />
          }
        />
      </SurfaceCard>

      {!preferencesLoaded ? (
        <EmptyState
          title="Loading preferences"
          message="Your settings will appear here shortly."
          icon="settings"
        />
      ) : null}
    </PremiumPage>
  );
}
