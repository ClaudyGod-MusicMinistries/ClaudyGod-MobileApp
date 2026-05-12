import React, { useMemo, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createSupportRequest } from '../../services/userFlowService';
import { useAppModal } from '../../context/AppModalContext';

const SUPPORT_CATEGORIES = [
  { id: 'playback', label: 'Playback' },
  { id: 'account', label: 'Account' },
  { id: 'content', label: 'Content' },
  { id: 'billing', label: 'Giving' },
  { id: 'technical', label: 'Technical' },
] as const;

type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['id'];

export default function Help() {
  const theme = useAppTheme();
  const { config } = useMobileAppConfig();
  const { showModal } = useAppModal();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('playback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supportCenterUrl = config?.help?.supportCenterUrl ?? 'https://claudygod.org';
  const contactOptions = useMemo(() => config?.help?.contact ?? [], [config]);
  const faqItems = useMemo(() => config?.help?.faqs ?? [], [config]);

  const submitSupportTicket = async () => {
    if (subject.trim().length < 4) {
      showModal({
        title: 'Add a subject',
        message: 'Enter a short subject so support can understand the request.',
        tone: 'warning',
        primaryAction: { label: 'Continue' },
      });
      return;
    }

    if (message.trim().length < 12) {
      showModal({
        title: 'Add more detail',
        message: 'Describe what happened and the device you are using.',
        tone: 'warning',
        primaryAction: { label: 'Continue' },
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await createSupportRequest({
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        priority: 'normal',
        metadata: { source: 'mobile_help_screen', platform: 'mobile' },
      });
      setSubject('');
      setMessage('');
      showModal({
        title: 'Support request sent',
        message: `Ticket ${response.ticket.id.slice(0, 8)} has been created.`,
        tone: 'success',
        primaryAction: { label: 'Done' },
      });
    } catch (error) {
      showModal({
        title: 'Request failed',
        message: error instanceof Error ? error.message : 'Unable to send support request.',
        tone: 'error',
        primaryAction: { label: 'Try again' },
      });
    }
    setSubmitting(false);
  };

  return (
    <SettingsScaffold
      title="Help & Support"
      subtitle="Simple support for playback, account access, giving, and content."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
              Support center
            </CustomText>
            <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 8 }}>
              Get help without confusion.
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
              Choose a quick contact option, send a clear request, or review answers to common questions.
            </CustomText>
            <AppButton title="Open support center" onPress={() => void Linking.openURL(supportCenterUrl)} style={{ marginTop: 16 }} />
          </SurfaceCard>
        </FadeIn>
      }
    >
      {contactOptions.length ? (
        <FadeIn delay={70}>
          <View style={{ gap: theme.spacing.sm }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Contact options
            </CustomText>
            {contactOptions.map((item) => (
              <TVTouchable key={item.id} onPress={() => void Linking.openURL(item.actionUrl)} showFocusBorder={false}>
                <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` }}>
                    <MaterialIcons name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={19} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText variant="label" style={{ color: theme.colors.text }}>
                      {item.title}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
                      {item.desc}
                    </CustomText>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </SurfaceCard>
              </TVTouchable>
            ))}
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={110}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Send a request
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
            Share the issue clearly and the support team will follow up through your account channel.
          </CustomText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {SUPPORT_CATEGORIES.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <TVTouchable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={{
                    borderRadius: theme.radius.pill,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? `${theme.colors.primary}1A` : theme.colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="caption" style={{ color: active ? theme.colors.primary : theme.colors.textSecondary }}>
                    {category.label}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>

          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Short subject"
            placeholderTextColor={theme.colors.textSecondary}
            style={{ marginTop: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.surface, color: theme.colors.text }}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe the issue and your device"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 132, marginTop: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.surface, color: theme.colors.text }}
          />

          <AppButton title="Submit request" loading={submitting} loadingLabel="Sending" fullWidth onPress={() => void submitSupportTicket()} style={{ marginTop: 14 }} />
        </SurfaceCard>
      </FadeIn>

      {faqItems.length ? (
        <FadeIn delay={150}>
          <View style={{ gap: theme.spacing.sm }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Quick answers
            </CustomText>
            {faqItems.map((faq) => {
              const open = expanded === faq.id;
              return (
                <TVTouchable key={faq.id} onPress={() => setExpanded(open ? null : faq.id)} showFocusBorder={false}>
                  <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={20} color={theme.colors.textSecondary} />
                      <CustomText variant="label" style={{ color: theme.colors.text, flex: 1 }}>
                        {faq.q}
                      </CustomText>
                    </View>
                    {open ? (
                      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 8, lineHeight: 18 }}>
                        {faq.a}
                      </CustomText>
                    ) : null}
                  </SurfaceCard>
                </TVTouchable>
              );
            })}
          </View>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}
