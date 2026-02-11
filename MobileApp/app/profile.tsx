import React, { useState } from 'react';
import { Image, TextInput, View } from 'react-native';
import { SettingsScaffold } from './settingsPage/Scaffold';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { useAppTheme } from '../util/colorScheme';
import { spacing, radius } from '../styles/designTokens';

export default function Profile() {
  const theme = useAppTheme();
  const [name, setName] = useState('Claudy God');
  const [email, setEmail] = useState('hello@claudygodmusic.com');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Lagos, NG');

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Update your account details and preferences."
      hero={
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: spacing.lg,
            alignItems: 'center',
          }}
        >
          <Image
            source={require('../assets/images/ClaudyGoLogo.webp')}
            style={{ width: 72, height: 72, borderRadius: 18, marginBottom: 12 }}
          />
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            ClaudyGod Music
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            Creator account • Streaming ministry
          </CustomText>
        </View>
      }
    >
      <View style={{ gap: spacing.md }}>
        <ProfileField label="Full name" value={name} onChangeText={setName} />
        <ProfileField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <ProfileField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <ProfileField label="Location" value={location} onChangeText={setLocation} />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <AppButton title="Save changes" variant="primary" fullWidth />
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
          We’ll connect this to your backend once endpoints are ready.
        </CustomText>
      </View>
    </SettingsScaffold>
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
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  const theme = useAppTheme();

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
        placeholderTextColor={theme.colors.text.secondary}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          color: theme.colors.text.primary,
          fontSize: theme.typography.body,
        }}
      />
    </View>
  );
}
