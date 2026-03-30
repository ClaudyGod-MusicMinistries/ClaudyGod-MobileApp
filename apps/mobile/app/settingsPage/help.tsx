import React, { useState } from 'react';
import { Alert, Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createSupportRequest } from '../../services/userFlowService';

const contact = [
  { icon: 'public', title: 'Ministry website', desc: 'Open the ClaudyGod website', action: () => Linking.openURL('https://claudygod.org') },
  { icon: 'email', title: 'Email support', desc: 'support@claudygod.org', action: () => Linking.openURL('mailto:support@claudygod.org') },
  { icon: 'forum', title: 'WhatsApp support', desc: 'Message the ministry support desk', action: () => Linking.openURL('https://wa.me/18002528394') },
  { icon: 'phone', title: 'Call support', desc: '+1 (800) 252-8394', action: () => Linking.openURL('tel:+18002528394') },
];

const faqs = [
  { q: 'Playback buffering on TV?', a: 'Use Ethernet or 5GHz Wi-Fi and keep playback quality on Adaptive mode.' },
  { q: 'Downloads not showing?', a: 'Open Library → Downloads and refresh. Check if storage permission is allowed.' },
  { q: 'Wrong recommendations?', a: 'Clear watch and listen history in Privacy settings to reset suggestions.' },
  { q: 'How do I report content?', a: 'Open track menu and tap Report, or send the media link to support email.' },
];

const supportCategories = [
  { id: 'playback', label: 'Playback' },
  { id: 'account', label: 'Account' },
  { id: 'content', label: 'Content' },
  { id: 'billing', label: 'Donations' },
  { id: 'technical', label: 'Technical' },
] as const;

export default function Help() {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<(typeof supportCategories)[number]['id']>('playback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { config } = useMobileAppConfig();

  const supportCenterUrl = config?.help.supportCenterUrl ?? 'https://claudygod.org';
  const contactOptions = config?.help.contact
    ? config.help.contact.map((item) => ({
        icon: item.icon,
        title: item.title,
        desc: item.desc,
        action: () => Linking.openURL(item.actionUrl),
      }))
    : contact;
  const faqItems = (config?.help.faqs ?? faqs).map((item) => ({ q: item.q, a: item.a }));

  const submitSupportTicket = async () => {
    if (subject.trim().length < 4) {
      Alert.alert('Add a subject', 'Please enter a short subject so the team can triage the issue.');
      return;
    }

    if (message.trim().length < 12) {
      Alert.alert('Add more detail', 'Please describe the issue in a little more detail before sending.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createSupportRequest({
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        priority: 'normal',
        metadata: {
          source: 'mobile_help_screen',
          platform: 'mobile',
        },
      });

      setSubject('');
      setMessage('');
      Alert.alert(
        'Support request sent',
        `Ticket ${response.ticket.id.slice(0, 8)} has been sent to the support team.`,
      );
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Unable to send support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingsScaffold
      title="Help & Support"
      subtitle="Fast support built for mobile and TV users."
      hero={
        <FadeIn>
          <SurfaceCard tone="subtle" style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              We keep you streaming
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              Reach support anytime or use the quick fixes below for playback, library, and account issues.
            </CustomText>
            <View style={{ marginTop: spacing.md }}>
              <AppButton
                title="Open Support Center"
                size="sm"
                variant="primary"
                onPress={() => Linking.openURL(supportCenterUrl)}
              />
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={90}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text, marginBottom: spacing.sm }}>
          Contact options
        </CustomText>
        <View style={{ marginBottom: spacing.lg }}>
          {contactOptions.map((item) => (
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
                  <CustomText variant="body" style={{ color: theme.colors.text }}>
                    {item.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
                    {item.desc}
                  </CustomText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </SurfaceCard>
            </TVTouchable>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={160}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text, marginBottom: spacing.sm }}>
          Send a support request
        </CustomText>
        <SurfaceCard tone="subtle" style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
            Use this form for complaints, broken playback, login issues, or content problems. Submissions are sent to the admin support inbox.
          </CustomText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md }}>
            {supportCategories.map((category) => {
              const active = category.id === selectedCategory;
              return (
                <TVTouchable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                  showFocusBorder={false}
                >
                  <View
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? `${theme.colors.primary}1A` : theme.colors.surface,
                    }}
                  >
                    <CustomText variant="caption" style={{ color: active ? theme.colors.primary : theme.colors.textSecondary }}>
                      {category.label}
                    </CustomText>
                  </View>
                </TVTouchable>
              );
            })}
          </View>

          <View style={{ marginTop: spacing.md }}>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Short subject"
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 16,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                marginBottom: spacing.sm,
              }}
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue, device, and what you expected to happen"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 140,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 16,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              }}
            />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <AppButton
              title="Submit support request"
              variant="primary"
              size="md"
              onPress={() => void submitSupportTicket()}
              loading={submitting}
              loadingLabel="Sending request"
              fullWidth
            />
          </View>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={220}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text, marginBottom: spacing.sm }}>
          Quick answers
        </CustomText>
        <View style={{ marginBottom: spacing.xl }}>
          {faqItems.map((faq) => {
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
                      color={theme.colors.textSecondary}
                    />
                    <CustomText variant="body" style={{ color: theme.colors.text, marginLeft: spacing.sm, flex: 1 }}>
                      {faq.q}
                    </CustomText>
                  </View>
                  {open ? (
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: spacing.sm }}>
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
