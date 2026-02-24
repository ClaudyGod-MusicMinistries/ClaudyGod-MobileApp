import React, { useEffect, useMemo, useState } from 'react';
import { Image, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './settingsPage/Scaffold';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { useAppTheme } from '../util/colorScheme';
import { spacing, radius } from '../styles/designTokens';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { fetchUserProfileMetrics } from '../services/supabaseAnalytics';

interface ProfileMetrics {
  email: string;
  displayName: string;
  totalPlays: number;
  liveSubscriptions: number;
}

const initialMetrics: ProfileMetrics = {
  email: '',
  displayName: 'ClaudyGod User',
  totalPlays: 0,
  liveSubscriptions: 0,
};

export default function Profile() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const [metrics, setMetrics] = useState<ProfileMetrics>(initialMetrics);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [name, setName] = useState('ClaudyGod User');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Lagos, NG');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const next = await fetchUserProfileMetrics();
      if (!mounted) return;
      setMetrics(next);
      if (next.displayName) setName(next.displayName);
      if (next.email) setEmail(next.email);
      setLoadingMetrics(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const statCards = useMemo(
    () => [
      { label: 'Most Played', value: String(metrics.totalPlays), icon: 'equalizer' as const },
      { label: 'Live Alerts', value: String(metrics.liveSubscriptions), icon: 'notifications-active' as const },
      { label: 'Profile', value: loadingMetrics ? '...' : 'Ready', icon: 'verified-user' as const },
    ],
    [loadingMetrics, metrics.liveSubscriptions, metrics.totalPlays],
  );

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Account details, streaming analytics and live alert preferences."
      hero={
        <FadeIn>
          <View
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
              backgroundColor: isDark ? 'rgba(12,9,20,0.88)' : theme.colors.surface,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,16,33,0.08)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
                }}
              >
                <Image source={require('../assets/images/ClaudyGoLogo.webp')} style={{ width: 76, height: 76, borderRadius: 38 }} />
              </View>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 12 }}>
                {name || metrics.displayName || 'ClaudyGod User'}
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4, textAlign: 'center' }}>
                {email || metrics.email || 'Guest mode'} • Creator / Listener profile
              </CustomText>

              <View
                style={{
                  marginTop: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(216,194,255,0.28)' : 'rgba(109,40,217,0.16)',
                  backgroundColor: isDark ? 'rgba(154,107,255,0.12)' : 'rgba(109,40,217,0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <CustomText variant="caption" style={{ color: isDark ? '#EDE3FF' : '#4C1D95' }}>
                  Supabase profile + analytics ready
                </CustomText>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {statCards.map((card) => (
                <View
                  key={card.label}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.06)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
                    padding: 10,
                  }}
                >
                  <MaterialIcons name={card.icon} size={16} color={theme.colors.primary} />
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginTop: 8 }}>
                    {card.value}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    {card.label}
                  </CustomText>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>
      }
    >
      <FadeIn delay={90}>
        <SectionCard title="Personal Information" hint="Used for account identity and notifications.">
          <View style={{ gap: spacing.md }}>
            <ProfileField label="Full name" value={name} onChangeText={setName} />
            <ProfileField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <ProfileField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <ProfileField label="Location" value={location} onChangeText={setLocation} />
          </View>
        </SectionCard>
      </FadeIn>

      <FadeIn delay={130}>
        <SectionCard title="Live & Notifications" hint="YouTube-style live alerts and preferences.">
          <View style={{ gap: 10 }}>
            {[
              { icon: 'notifications-active', title: 'Live alerts', subtitle: 'Notify when channels go live' },
              { icon: 'campaign', title: 'Ad preferences', subtitle: 'Manage sponsored placements visibility' },
              { icon: 'insights', title: 'Playback analytics', subtitle: 'Track most played and engagement trends' },
            ].map((item) => (
              <TVTouchable
                key={item.title}
                onPress={() => undefined}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,16,33,0.06)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                showFocusBorder={false}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
                    marginRight: 10,
                  }}
                >
                  <MaterialIcons name={item.icon as any} size={17} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                    {item.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    {item.subtitle}
                  </CustomText>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
              </TVTouchable>
            ))}
          </View>
        </SectionCard>
      </FadeIn>

      <FadeIn delay={170}>
        <View style={{ marginTop: spacing.lg }}>
          <AppButton title="Save changes" variant="primary" fullWidth />
          <AppButton
            title="Log out"
            variant="ghost"
            fullWidth
            style={{
              marginTop: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(248,113,113,0.2)' : 'rgba(220,38,38,0.14)',
              backgroundColor: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.05)',
            }}
            textColor={isDark ? '#FCA5A5' : '#B91C1C'}
            leftIcon={<MaterialIcons name="logout" size={18} color={isDark ? '#FCA5A5' : '#B91C1C'} />}
          />
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
            Profile updates are ready for Supabase tables and storage-backed avatars.
          </CustomText>
        </View>
      </FadeIn>
    </SettingsScaffold>
  );
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(12,9,20,0.86)' : theme.colors.surface,
        padding: spacing.md,
      }}
    >
      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      {hint ? (
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3, marginBottom: 10 }}>
          {hint}
        </CustomText>
      ) : null}
      {children}
    </View>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (_text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  return (
    <View>
      <CustomText variant="label" style={{ color: theme.colors.text.secondary, marginBottom: 6 }}>
        {label}
      </CustomText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={isDark ? 'rgba(194,185,220,0.75)' : 'rgba(108,99,134,0.75)'}
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          color: theme.colors.text.primary,
          fontSize: theme.typography.body,
          fontFamily: 'Sora_400Regular',
        }}
      />
    </View>
  );
}
