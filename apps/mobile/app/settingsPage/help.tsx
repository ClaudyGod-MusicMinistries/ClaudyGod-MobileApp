import React, { useState } from 'react';
import { View, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';

const contact = [
  { icon: 'chat-bubble', title: 'Live chat', desc: 'Average response under 2 minutes', action: () => console.log('chat') },
  { icon: 'email', title: 'Email support', desc: 'support@claudygodmusic.com', action: () => Linking.openURL('mailto:support@claudygodmusic.com') },
  { icon: 'phone', title: 'Call support', desc: '+1 (800) 252-8394', action: () => Linking.openURL('tel:+18002528394') },
];

const faqs = [
  { q: 'Playback buffering on TV?', a: 'Use Ethernet or 5GHz Wi-Fi and keep playback quality on Adaptive mode.' },
  { q: 'Downloads not showing?', a: 'Open Library → Downloads and refresh. Check if storage permission is allowed.' },
  { q: 'Wrong recommendations?', a: 'Clear watch and listen history in Privacy settings to reset suggestions.' },
  { q: 'How do I report content?', a: 'Open track menu and tap Report, or send the media link to support email.' },
];

export default function Help() {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SettingsScaffold
      title="Help & Support"
      subtitle="Fast support built for mobile and TV users."
      hero={
        <FadeIn>
          <SurfaceCard tone="subtle" style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
              We keep you streaming
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
              Reach support anytime or use the quick fixes below for playback, library, and account issues.
            </CustomText>
            <View style={{ marginTop: spacing.md }}>
              <AppButton
                title="Open Support Center"
                size="sm"
                variant="primary"
                onPress={() => console.log('Open support center')}
              />
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={90}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Contact options
        </CustomText>
        <View style={{ marginBottom: spacing.lg }}>
          {contact.map((item) => (
            <TVTouchable key={item.title} onPress={item.action} style={{ marginBottom: spacing.sm }} showFocusBorder={false}>
              <SurfaceCard style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: `${theme.colors.primary}1F`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                  }}
                >
                  <MaterialIcons name={item.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText variant="body" style={{ color: theme.colors.text.primary }}>
                    {item.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    {item.desc}
                  </CustomText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
              </SurfaceCard>
            </TVTouchable>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={160}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Quick answers
        </CustomText>
        <View style={{ marginBottom: spacing.xl }}>
          {faqs.map((faq) => {
            const open = expanded === faq.q;
            return (
              <TVTouchable
                key={faq.q}
                onPress={() => setExpanded(open ? null : faq.q)}
                style={{ marginBottom: spacing.sm }}
                showFocusBorder={false}
              >
                <SurfaceCard tone={open ? 'subtle' : 'default'} style={{ padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons
                      name={open ? 'expand-less' : 'expand-more'}
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                    <CustomText variant="body" style={{ color: theme.colors.text.primary, marginLeft: spacing.sm, flex: 1 }}>
                      {faq.q}
                    </CustomText>
                  </View>
                  {open ? (
                    <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: spacing.sm }}>
                      {faq.a}
                    </CustomText>
                  ) : null}
                </SurfaceCard>
              </TVTouchable>
            );
          })}
        </View>
      </FadeIn>
    </SettingsScaffold>
  );
}
