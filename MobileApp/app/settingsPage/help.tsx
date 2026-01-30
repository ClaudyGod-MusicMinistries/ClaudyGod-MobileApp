// app/settingsPage/help.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { spacing, radius, shadows } from '../../styles/designTokens';
import { MaterialIcons } from '@expo/vector-icons';

const contact = [
  { icon: 'chat-bubble', title: 'Live chat', desc: 'Avg response < 2 min', action: () => console.log('chat') },
  { icon: 'email', title: 'Email', desc: 'support@claudygodmusic.com', action: () => Linking.openURL('mailto:support@claudygodmusic.com') },
  { icon: 'phone', title: 'Call', desc: '+1 (800) 252-8394', action: () => Linking.openURL('tel:+18002528394') },
];

const faqs = [
  { q: 'Playback buffering on TV?', a: 'Use Ethernet/5GHz and choose Adaptive in Settings → Playback.' },
  { q: 'Downloads not showing?', a: 'Toggle airplane mode off/on, then refresh Library → Downloads.' },
  { q: 'Wrong recommendations?', a: 'Clear history in Settings → Privacy → Reset recommendations.' },
  { q: 'Report content?', a: 'Open the track ••• menu → Report, or email the link to support.' },
];

export default function Help() {
  const scheme = useColorScheme();
  const palette = colors[scheme];
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SettingsScaffold
      title="Help & Support"
      subtitle="Always-on assistance for mobile and TV."
      hero={
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: palette.border,
            marginBottom: spacing.lg,
            ...shadows.card,
          }}
        >
          <CustomText style={{ color: palette.text.primary, fontWeight: '800', fontSize: 22 }}>
            We keep you streaming.
          </CustomText>
          <CustomText style={{ color: palette.text.secondary, marginTop: 6, lineHeight: 22 }}>
            Reach us anytime or browse quick fixes below. Optimized for remote navigation and touch.
          </CustomText>
        </View>
      }
    >
      {/* Contact cards */}
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {contact.map((item) => (
          <TouchableOpacity
            key={item.title}
            onPress={item.action}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
              ...shadows.soft,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: `${palette.primary}22`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <MaterialIcons name={item.icon as any} size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText style={{ color: palette.text.primary, fontWeight: '700' }}>{item.title}</CustomText>
              <CustomText style={{ color: palette.text.secondary }}>{item.desc}</CustomText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={palette.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQs */}
      <CustomText className="font-bold" style={{ color: palette.text.primary, fontSize: 18, marginBottom: spacing.sm }}>
        Quick answers
      </CustomText>
      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        {faqs.map((faq) => {
          const open = expanded === faq.q;
          return (
            <TouchableOpacity
              key={faq.q}
              onPress={() => setExpanded(open ? null : faq.q)}
              style={{
                backgroundColor: palette.surface,
                borderRadius: radius.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={palette.text.secondary} />
                <CustomText style={{ color: palette.text.primary, marginLeft: spacing.sm, flex: 1, fontWeight: '700' }}>
                  {faq.q}
                </CustomText>
              </View>
              {open && (
                <CustomText style={{ color: palette.text.secondary, marginTop: spacing.xs, lineHeight: 20 }}>
                  {faq.a}
                </CustomText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SettingsScaffold>
  );
}
