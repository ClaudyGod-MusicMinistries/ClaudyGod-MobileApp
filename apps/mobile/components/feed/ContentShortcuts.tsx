import React from 'react';
import { ScrollView, View } from 'react-native';

import { CustomText } from '../CustomText';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useFeedStyles } from './styles';

export type ContentShortcut = {
  id: string;
  label: string;
  icon: AppIconName;
  color: string;
  onPress: () => void;
};

export function ContentShortcuts({ shortcuts }: { shortcuts: ContentShortcut[] }) {
  const styles = useFeedStyles();

  return (
    <FadeIn delay={40}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2, paddingRight: 4 }}>
        {shortcuts.map((item) => (
          <TVTouchable key={item.id} onPress={item.onPress} showFocusBorder={false}>
            <View style={styles.shortcutItem}>
              <View style={{ width: 60, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${item.color}14`, borderWidth: 1, borderColor: `${item.color}28` }}>
                <AppIcon name={item.icon} size={23} color={item.color} />
              </View>
              <CustomText style={styles.shortcutLabel} numberOfLines={1}>{item.label}</CustomText>
            </View>
          </TVTouchable>
        ))}
      </ScrollView>
    </FadeIn>
  );
}
