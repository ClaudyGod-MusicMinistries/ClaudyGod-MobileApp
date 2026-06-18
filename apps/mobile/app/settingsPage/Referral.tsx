import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { PremiumPage, SectionLabel } from '../../components/Exp/PremiumContent';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../util/colorScheme';
import { useReferral } from '../../hooks/useReferral';
import { APP_ROUTES } from '../../util/appRoutes';

const HOW_IT_WORKS = [
  { step: '1', icon: 'share' as const,        title: 'Share your link',     body: 'Send your unique referral link to friends and family.' },
  { step: '2', icon: 'person-add' as const,   title: 'Friend joins free',   body: 'They create a free ClaudyGod account — no payment needed.' },
  { step: '3', icon: 'stars' as const,        title: 'Both of you benefit',  body: 'You both unlock early access to exclusive worship content.' },
] as const;

const REWARDS = [
  { icon: 'library-music' as const, color: '#8B5CF6', label: '1 referral',  reward: 'Early access to new albums' },
  { icon: 'live-tv' as const,       color: '#60A5FA', label: '3 referrals', reward: 'Exclusive live session invite' },
  { icon: 'workspace-premium' as const, color: '#F59E0B', label: '10 referrals', reward: 'Premium member badge' },
] as const;

function CodeDisplay({ code, isCopied, onCopy }: { code: string; isCopied: boolean; onCopy: () => void }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 24,
        gap: 12,
      }}
    >
      {/* Code pill */}
      <TVTouchable
        onPress={onCopy}
        showFocusBorder={false}
        style={{
          backgroundColor: 'rgba(139,92,246,0.10)',
          borderWidth: 1.5,
          borderColor: 'rgba(139,92,246,0.35)',
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 28,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CustomText
          style={{
            color: '#C4B5FD',
            fontSize: 28,
            fontWeight: '800',
            letterSpacing: 4,
            fontVariant: ['tabular-nums'],
          }}
        >
          {code}
        </CustomText>
        <MaterialIcons
          name={isCopied ? 'check-circle' : 'content-copy'}
          size={20}
          color={isCopied ? '#34D399' : '#8B5CF6'}
        />
      </TVTouchable>

      <CustomText
        style={{
          color: isCopied ? '#34D399' : theme.colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          textAlign: 'center',
        }}
      >
        {isCopied ? 'Copied to clipboard!' : 'Tap to copy your code'}
      </CustomText>
    </View>
  );
}

function GuestGate() {
  const theme = useAppTheme();
  const router = useRouter();
  return (
    <SurfaceCard tone="strong" style={{ padding: 24, alignItems: 'center', gap: 16 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: 'rgba(139,92,246,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.22)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="card-giftcard" size={30} color="#8B5CF6" />
      </View>
      <CustomText style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 }}>
        Get your referral code
      </CustomText>
      <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13.5, textAlign: 'center', lineHeight: 20 }}>
        Create a free account to receive your unique referral code and start inviting friends to the ClaudyGod community.
      </CustomText>
      <View style={{ width: '100%', gap: 10 }}>
        <AppButton
          title="Create free account"
          size="md"
          fullWidth
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
          leftIcon={<MaterialIcons name="person-add" size={16} color="#FFFFFF" />}
        />
        <AppButton
          title="Sign in"
          variant="outline"
          size="md"
          fullWidth
          onPress={() => router.push(APP_ROUTES.auth.signIn)}
          leftIcon={<MaterialIcons name="login" size={16} color="#8B5CF6" />}
        />
      </View>
    </SurfaceCard>
  );
}

export default function ReferralScreen() {
  const theme = useAppTheme();
  const { isAuthenticated } = useAuth();
  const { code, referralCount, isLoading, share, copyCode, isCopied } = useReferral();

  return (
    <PremiumPage title="Invite Friends" eyebrow="Referrals">
      {/* Hero card */}
      <SurfaceCard tone="strong" style={{ overflow: 'hidden' }}>
        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: 'rgba(139,92,246,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(139,92,246,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="card-giftcard" size={18} color="#8B5CF6" />
            </View>
            <View>
              <CustomText style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Referral Program
              </CustomText>
              <CustomText style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginTop: 1 }}>
                Invite & earn rewards
              </CustomText>
            </View>
          </View>

          <CustomText style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
            Share ClaudyGod with the people in your life. Every friend you invite gets free access — and you both unlock exclusive rewards.
          </CustomText>
        </View>

        {/* Referral count strip */}
        {isAuthenticated && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: 'rgba(139,92,246,0.07)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(139,92,246,0.14)',
            }}
          >
            <MaterialIcons name="group" size={16} color="#8B5CF6" />
            <CustomText style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
              {referralCount === 0
                ? 'No referrals yet — start sharing!'
                : `${referralCount} friend${referralCount === 1 ? '' : 's'} joined through your link`}
            </CustomText>
          </View>
        )}
      </SurfaceCard>

      {/* Code / guest gate */}
      {!isAuthenticated ? (
        <GuestGate />
      ) : isLoading ? (
        <SurfaceCard tone="strong" style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </SurfaceCard>
      ) : code ? (
        <SurfaceCard tone="strong" style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <CodeDisplay code={code} isCopied={isCopied} onCopy={copyCode} />

          <AppButton
            title="Share your invite link"
            size="lg"
            fullWidth
            onPress={() => void share()}
            leftIcon={<MaterialIcons name="share" size={18} color="#FFFFFF" />}
            style={{
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.30,
              shadowRadius: 10,
              elevation: 8,
            }}
          />
        </SurfaceCard>
      ) : null}

      {/* How it works */}
      <View style={{ gap: 12 }}>
        <SectionLabel title="How it works" accent="Simple" />
        <SurfaceCard tone="subtle" style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 18 }}>
          {HOW_IT_WORKS.map((step) => (
            <View key={step.step} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  backgroundColor: 'rgba(139,92,246,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MaterialIcons name={step.icon} size={17} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText style={{ color: theme.colors.text, fontSize: 13.5, fontWeight: '700', marginBottom: 3 }}>
                  {step.title}
                </CustomText>
                <CustomText style={{ color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
                  {step.body}
                </CustomText>
              </View>
            </View>
          ))}
        </SurfaceCard>
      </View>

      {/* Rewards milestones */}
      <View style={{ gap: 12 }}>
        <SectionLabel title="Rewards" accent="Unlock" subtitle="More friends = more benefits" />
        <View style={{ gap: 10 }}>
          {REWARDS.map((reward) => (
            <SurfaceCard
              key={reward.label}
              tone="subtle"
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: `${reward.color}16`,
                  borderWidth: 1,
                  borderColor: `${reward.color}28`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={reward.icon} size={20} color={reward.color} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText style={{ color: theme.colors.primary, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                  {reward.label}
                </CustomText>
                <CustomText style={{ color: theme.colors.text, fontSize: 13.5, fontWeight: '600' }}>
                  {reward.reward}
                </CustomText>
              </View>
              <MaterialIcons name="lock-outline" size={16} color={theme.colors.textMuted} />
            </SurfaceCard>
          ))}
        </View>
      </View>

    </PremiumPage>
  );
}
