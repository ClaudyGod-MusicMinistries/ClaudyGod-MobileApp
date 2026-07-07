import React from 'react';
import { View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { useAppModal } from '../../context/AppModalContext';
import { useFeedStyles } from './styles';

export function GreetingBanner({ name }: { name?: string | null; newCount?: number }) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const { showModal } = useAppModal();
  const hour   = new Date().getHours();
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = name ? name.split(' ')[0] : null;
  const dateStr   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <FadeIn>
      <View style={styles.greetingRow}>
        <View style={styles.greetingLeft}>
          <CustomText style={styles.greetingTitle} numberOfLines={1}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </CustomText>
          <CustomText style={styles.greetingDate}>{dateStr}</CustomText>
        </View>
        <TVTouchable onPress={() => showModal({ title: 'Coming soon', message: 'Notifications are on the way.', tone: 'info', primaryAction: { label: 'Got it' } })} showFocusBorder={false} style={styles.greetingNotifBtn}>
          <MaterialIcons name="notifications-none" size={20} color={theme.colors.text} />
        </TVTouchable>
      </View>
    </FadeIn>
  );
}
