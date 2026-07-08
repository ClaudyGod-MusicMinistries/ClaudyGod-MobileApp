import React from 'react';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';

export function BackToHomeButton() {
  const router = useRouter();
  const theme  = useAppTheme();
  return (
    <AppButton
      title="Home"
      variant="secondary"
      size="sm"
      onPress={() => router.push('/(tabs)/home' as never)}
      leftIcon={<MaterialIcons name="home-filled" size={15} color={theme.colors.text} />}
    />
  );
}
