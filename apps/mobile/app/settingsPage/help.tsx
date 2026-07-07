import React, { useMemo, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createSupportRequest } from '../../services/userFlowService';
import { useAppModal } from '../../context/AppModalContext';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // SectionLabel
  sectionLbl:      { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 4 },

  // Hero card
  heroCard:        { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 20, gap: 16 },
  heroIconBox:     { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  heroTextWrap:    { gap: 6 },
  heroTitle:       { color: theme.colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  heroSubtitle:    { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },

  // Contact section
  sectionGap:      { gap: 10 },
  contactList:     { borderRadius: 16, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  contactRowBase:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  contactDivider:  { borderTopColor: theme.colors.divider },
  contactIconBox:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface },
  contactTextWrap: { flex: 1 },
  contactTitle:    { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  contactDesc:     { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },

  // Support form
  formCard:        { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, gap: 16 },
  formDesc:        { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },
  pillRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillBase:        { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive:      { backgroundColor: theme.colors.primary },
  pillInactive:    { backgroundColor: theme.colors.surfaceAlt },
  pillTxtActive:   { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '600' },
  pillTxtInactive: { color: theme.colors.textMuted,   fontSize: 13, fontWeight: '600' },
  inputBase: {
    borderRadius: 12, backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 14, paddingVertical: 13,
    color: theme.colors.text, fontSize: 14,
  },
  inputMulti:      { minHeight: 120 },

  // FAQ
  faqList:         { borderRadius: 16, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  faqRowBase:      { paddingVertical: 14, paddingHorizontal: 16 },
  faqDivider:      { borderTopColor: theme.colors.divider },
  faqQuestionRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQuestion:     { color: theme.colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  faqAnswer:       { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 10, paddingLeft: 32 },
}));

// ─── Types ────────────────────────────────────────────────────────────────────

const SUPPORT_CATEGORIES = [
  { id: 'playback',  label: 'Playback' },
  { id: 'account',   label: 'Account' },
  { id: 'content',   label: 'Content' },
  { id: 'billing',   label: 'Giving' },
  { id: 'technical', label: 'Technical' },
] as const;

type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['id'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  const styles = useStyles();
  return <CustomText style={styles.sectionLbl}>{title}</CustomText>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Help() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const { config } = useMobileAppConfig();
  const { showModal } = useAppModal();
  const [expanded,         setExpanded]         = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('playback');
  const [subject,          setSubject]          = useState('');
  const [message,          setMessage]          = useState('');
  const [submitting,       setSubmitting]       = useState(false);

  const supportCenterUrl = config?.help?.supportCenterUrl ?? 'https://claudygod.org';
  const contactOptions   = useMemo(() => config?.help?.contact ?? [], [config]);
  const faqItems         = useMemo(() => config?.help?.faqs ?? [], [config]);

  const submitSupportTicket = async () => {
    if (subject.trim().length < 4) {
      showModal({ title: 'Add a subject', message: 'Enter a short subject so support can understand the request.', tone: 'warning', primaryAction: { label: 'Continue' } });
      return;
    }
    if (message.trim().length < 12) {
      showModal({ title: 'Add more detail', message: 'Describe what happened and the device you are using.', tone: 'warning', primaryAction: { label: 'Continue' } });
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
      showModal({ title: 'Support request sent', message: `Ticket ${response.ticket.id.slice(0, 8)} has been created.`, tone: 'success', primaryAction: { label: 'Done' } });
    } catch (error) {
      showModal({ title: 'Request failed', message: error instanceof Error ? error.message : 'Unable to send support request.', tone: 'error', primaryAction: { label: 'Try again' } });
    }
    setSubmitting(false);
  };

  return (
    <SettingsScaffold
      title="Help & Support"
      subtitle="Support for playback, account access, giving, and content."
      icon="support-agent"
      hero={
        <FadeIn>
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <MaterialIcons name="support-agent" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.heroTextWrap}>
              <CustomText style={styles.heroTitle}>Get help without confusion.</CustomText>
              <CustomText style={styles.heroSubtitle}>
                Choose a quick contact option, send a clear request, or review answers to common questions.
              </CustomText>
            </View>
            <AppButton
              title="Open support center"
              size="md"
              onPress={() => void Linking.openURL(supportCenterUrl)}
              leftIcon={<MaterialIcons name="open-in-new" size={16} color={theme.colors.onPrimary} />}
            />
          </View>
        </FadeIn>
      }
    >
      {contactOptions.length ? (
        <FadeIn delay={70}>
          <View style={styles.sectionGap}>
            <SectionLabel title="Contact options" />
            <View style={styles.contactList}>
              {contactOptions.map((item, index) => (
                <TVTouchable
                  key={item.id}
                  onPress={() => void Linking.openURL(item.actionUrl)}
                  showFocusBorder={false}
                  style={[styles.contactRowBase, styles.contactDivider, { borderTopWidth: index === 0 ? 0 : 1 }]}
                >
                  <View style={styles.contactIconBox}>
                    <MaterialIcons
                      name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.contactTextWrap}>
                    <CustomText style={styles.contactTitle}>{item.title}</CustomText>
                    <CustomText style={styles.contactDesc}>{item.desc}</CustomText>
                  </View>
                  <MaterialIcons name="open-in-new" size={16} color={theme.colors.textMuted} />
                </TVTouchable>
              ))}
            </View>
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={110}>
        <View style={styles.sectionGap}>
          <SectionLabel title="Send a request" />
          <View style={styles.formCard}>
            <CustomText style={styles.formDesc}>
              Share the issue clearly and the support team will follow up through your account channel.
            </CustomText>

            <View style={styles.pillRow}>
              {SUPPORT_CATEGORIES.map((category) => {
                const active = selectedCategory === category.id;
                return (
                  <TVTouchable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={[styles.pillBase, active ? styles.pillActive : styles.pillInactive]}
                    showFocusBorder={false}
                  >
                    <CustomText style={active ? styles.pillTxtActive : styles.pillTxtInactive}>
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
              placeholderTextColor={theme.colors.textMuted}
              style={styles.inputBase}
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue and your device"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
              style={[styles.inputBase, styles.inputMulti]}
            />

            <AppButton
              title="Submit request"
              loading={submitting}
              loadingLabel="Sending"
              fullWidth
              onPress={() => void submitSupportTicket()}
            />
          </View>
        </View>
      </FadeIn>

      {faqItems.length ? (
        <FadeIn delay={150}>
          <View style={styles.sectionGap}>
            <SectionLabel title="Quick answers" />
            <View style={styles.faqList}>
              {faqItems.map((faq, index) => {
                const open = expanded === faq.id;
                return (
                  <TVTouchable
                    key={faq.id}
                    onPress={() => setExpanded(open ? null : faq.id)}
                    showFocusBorder={false}
                    style={[styles.faqRowBase, styles.faqDivider, { borderTopWidth: index === 0 ? 0 : 1 }]}
                  >
                    <View style={styles.faqQuestionRow}>
                      <MaterialIcons
                        name={open ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={theme.colors.textMuted}
                      />
                      <CustomText style={styles.faqQuestion}>{faq.q}</CustomText>
                    </View>
                    {open ? <CustomText style={styles.faqAnswer}>{faq.a}</CustomText> : null}
                  </TVTouchable>
                );
              })}
            </View>
          </View>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}
