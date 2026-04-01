// models/businessModels.ts
// Business models and monetization strategies for ClaudyGod

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  description: string;
  features: string[];
  adsFree: boolean;
  downloadLimit: number;
  offlineAccess: boolean;
  prioritySupport: boolean;
}

export type SupportCadence = 'daily' | 'weekly' | 'monthly';

export interface SupportPlan {
  id: string;
  name: string;
  cadence: SupportCadence;
  amount: number;
  currency: string;
  description: string;
  perks: string[];
}

export interface MinistrySupportModule {
  title: string;
  subtitle: string;
  message: string;
  plans: SupportPlan[];
  defaultPlanId: string;
  suggestedAmounts: number[];
  paymentProviders: string[];
  securityNotes: string[];
}

export interface AdPlacement {
  id: string;
  type: 'banner' | 'interstitial' | 'rewarded' | 'native';
  position: 'top' | 'bottom' | 'middle' | 'overlay';
  targetAudience: SubscriptionTier[];
  impressionTarget: number;
  cpmRate: number; // Cost per thousand impressions
  active: boolean;
}

export interface UserMonetizationProfile {
  userId: string;
  tier: SubscriptionTier;
  adExposure: {
    impressions: number;
    clicks: number;
    revenue: number;
  };
  subscribedAt?: string;
  renewalDate?: string;
  lifetimeEngagement: {
    hoursListened: number;
    itemsViewed: number;
    liveSessionsAttended: number;
  };
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'plan_free',
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    description: 'Access basic content with ads',
    features: [
      'Access to basic content library',
      'Ad-supported streaming',
      'Limited downloads (10 per month)',
      'Community access',
      'Standard quality (up to 128kbps)',
    ],
    adsFree: false,
    downloadLimit: 10,
    offlineAccess: false,
    prioritySupport: false,
  },
  pro: {
    id: 'plan_pro',
    tier: 'pro',
    name: 'Pro',
    price: 4.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    description: 'Ad-free with enhanced features',
    features: [
      'Ad-free streaming',
      'Access to full content library',
      'Unlimited downloads',
      'Offline access',
      'High quality audio (up to 320kbps)',
      'Family sharing (up to 4 users)',
      'Email support',
    ],
    adsFree: true,
    downloadLimit: -1, // Unlimited
    offlineAccess: true,
    prioritySupport: false,
  },
  premium: {
    id: 'plan_premium',
    tier: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    description: 'Ultimate experience with exclusive content',
    features: [
      'Everything in Pro',
      'Exclusive content and early access',
      'Lossless audio quality (FLAC)',
      'Spatial audio (Dolby Atmos)',
      'Family sharing unlimited',
      'Priority support (via chat)',
      'Ad exclusions',
      'Premium content early access',
    ],
    adsFree: true,
    downloadLimit: -1,
    offlineAccess: true,
    prioritySupport: true,
  },
  enterprise: {
    id: 'plan_enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    currency: 'USD',
    billingPeriod: 'yearly',
    description: 'Custom solutions for organizations',
    features: [
      'Everything in Premium',
      'Custom content management',
      'API access',
      'Analytics dashboard',
      'Dedicated account manager',
      'SLA guaranteed uptime',
      'Custom branding options',
      'Bulk user management',
    ],
    adsFree: true,
    downloadLimit: -1,
    offlineAccess: true,
    prioritySupport: true,
  },
};

// Ad Placements Configuration
export const AD_PLACEMENTS: AdPlacement[] = [
  {
    id: 'banner_home_top',
    type: 'banner',
    position: 'top',
    targetAudience: ['free'],
    impressionTarget: 1000000,
    cpmRate: 5,
    active: true,
  },
  {
    id: 'interstitial_navigation',
    type: 'interstitial',
    position: 'overlay',
    targetAudience: ['free'],
    impressionTarget: 500000,
    cpmRate: 15,
    active: true,
  },
  {
    id: 'native_content_rail',
    type: 'native',
    position: 'middle',
    targetAudience: ['free'],
    impressionTarget: 2000000,
    cpmRate: 8,
    active: true,
  },
  {
    id: 'rewarded_offline',
    type: 'rewarded',
    position: 'overlay',
    targetAudience: ['free', 'pro'],
    impressionTarget: 100000,
    cpmRate: 25,
    active: true,
  },
];

// Ministry Support Module Configuration
export const MINISTRY_SUPPORT_MODEL: MinistrySupportModule = {
  title: 'Support Our Ministry',
  subtitle: 'Partner with us to keep the message moving',
  message:
    'Your support helps deliver worship, teaching, and community resources to people everywhere. Choose a cadence that fits you.',
  plans: [
    {
      id: 'support_daily',
      name: 'Daily Support',
      cadence: 'daily',
      amount: 2,
      currency: 'USD',
      description: 'A small daily gift that adds up to consistent impact.',
      perks: ['Daily impact streak', 'Prayer partner updates'],
    },
    {
      id: 'support_weekly',
      name: 'Weekly Support',
      cadence: 'weekly',
      amount: 10,
      currency: 'USD',
      description: 'Fuel weekly production and community outreach.',
      perks: ['Weekly impact update', 'Early access to select releases'],
    },
    {
      id: 'support_monthly',
      name: 'Monthly Support',
      cadence: 'monthly',
      amount: 25,
      currency: 'USD',
      description: 'Sustain content creation and global reach.',
      perks: ['Monthly partner note', 'Exclusive ministry briefings'],
    },
  ],
  defaultPlanId: 'support_monthly',
  suggestedAmounts: [5, 10, 25, 50, 100],
  paymentProviders: ['Flutterwave', 'Paystack', 'Stripe'],
  securityNotes: ['Tokenized payments', 'PCI-compliant processing', 'Encrypted payment intents'],
};

// Revenue Projections
export interface RevenueMetrics {
  arpu: number; // Average revenue per user
  tier: SubscriptionTier;
  subscriptionRevenue: number;
  adRevenue: number;
  totalRevenue: number;
}

// Calculate revenue per user per month based on tier
export function calculateMonthlyRevenue(
  tier: SubscriptionTier,
  adImpressions: number = 0,
  subscriptionCount: number = 1,
): RevenueMetrics {
  const plan = SUBSCRIPTION_PLANS[tier];
  const subscriptionRevenue = plan.price * subscriptionCount;

  // Ad revenue: (impressions / 1000) * CPM
  const avgCPM = 10; // Average CPM across all placements
  let adRevenue = 0;

  if (!plan.adsFree && adImpressions > 0) {
    adRevenue = (adImpressions / 1000) * avgCPM;
  }

  return {
    arpu: subscriptionRevenue + adRevenue,
    tier,
    subscriptionRevenue,
    adRevenue,
    totalRevenue: subscriptionRevenue + adRevenue,
  };
}

// Business model strategies
export const BUSINESS_MODEL_STRATEGIES = {
  viral: {
    description: 'Grow user base through referral and social sharing',
    tactics: [
      'Referral rewards (both referrer and referee get benefits)',
      'Social media integration (share music, messages, live sessions)',
      'Viral loops in content discovery',
    ],
  },
  engagement: {
    description: 'Maximize user engagement and lifetime value',
    tactics: [
      'Daily engagement rewards (login streaks, activity badges)',
      'Personalized recommendations',
      'Community features (followers, sharing)',
      'Gamification (achievements, milestones)',
    ],
  },
  monetization: {
    description: 'Optimize revenue from engaged users',
    tactics: [
      'Freemium model with clear upgrade path',
      'Strategic ad placements (non-obtrusive)',
      'Premium content tiers',
      'Family plans and group subscriptions',
    ],
  },
  retention: {
    description: 'Keep users coming back',
    tactics: [
      'Personalized push notifications',
      'Content recommendations',
      'Community features',
      'Exclusive member benefits',
    ],
  },
};

// Success metrics
export interface BusinessMetrics {
  dau: number; // Daily active users
  mau: number; // Monthly active users
  conversionRateFreeToPro: number;
  avgSubscriptionLength: number; // months
  churnRate: number;
  engagementScore: number; // 0-100
  lifetimeValue: number;
  acquisitionCost: number;
}

export const KPI_TARGETS = {
  dau: 100000,
  mau: 500000,
  conversionRateFreeToPro: 0.05, // 5%
  avgSubscriptionLength: 12,
  churnRate: 0.05, // 5% monthly churn
  engagementScore: 75,
  lifetimeValue: 120, // $120 per user
  acquisitionCost: 8, // $8 per user
};
