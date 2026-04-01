/**
 * Donation & Support Business Models
 * Handles the support/donation system for the ministry
 */

export type DonationFrequency = 'daily' | 'weekly' | 'monthly';

export interface DonationTier {
  id: string;
  name: string;
  frequency: DonationFrequency;
  amounts: number[]; // Different amount options (e.g., [5, 10, 25, 50, 100])
  description: string;
  icon: string;
  color: string;
  badge?: string;
}

export interface DonationSession {
  id: string;
  userId: string | null; // null for guests
  tier: DonationTier;
  selectedAmount: number;
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  paymentMethod: 'card' | 'mobile_money' | 'bank_transfer' | null;
  transactionId?: string;
  errorMessage?: string;
}

export interface DonationHistory {
  id: string;
  userId: string | null;
  tier: DonationTier;
  amount: number;
  frequency: DonationFrequency;
  paymentMethod: 'card' | 'mobile_money' | 'bank_transfer';
  transactionId: string;
  status: 'completed' | 'failed' | 'refunded';
  initiatedAt: Date;
  completedAt: Date;
}

// Define the available donation tiers
export const DONATION_TIERS: Record<DonationFrequency, DonationTier> = {
  daily: {
    id: 'daily-support',
    name: 'Daily Support',
    frequency: 'daily',
    amounts: [1, 2, 5, 10],
    description: 'Support us every day',
    icon: 'favorite',
    color: '#EF4444',
    badge: 'Most Impactful',
  },
  weekly: {
    id: 'weekly-support',
    name: 'Weekly Support',
    frequency: 'weekly',
    amounts: [10, 25, 50, 100],
    description: 'Weekly contribution to our ministry',
    icon: 'calendar-today',
    color: '#F59E0B',
  },
  monthly: {
    id: 'monthly-support',
    name: 'Monthly Support',
    frequency: 'monthly',
    amounts: [50, 100, 250, 500],
    description: 'Become a monthly supporter',
    icon: 'receipt-long',
    color: '#10B981',
    badge: 'Popular',
  },
};

/**
 * Generates a unique donation session ID
 */
export function generateDonationSessionId(): string {
  return `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a new donation session
 */
export function createDonationSession(
  tier: DonationTier,
  selectedAmount: number,
  userId: string | null = null
): DonationSession {
  return {
    id: generateDonationSessionId(),
    userId,
    tier,
    selectedAmount,
    status: 'initiated',
    createdAt: new Date(),
    paymentMethod: null,
  };
}

/**
 * Validates donation amount for a tier
 */
export function isValidDonationAmount(tier: DonationTier, amount: number): boolean {
  return tier.amounts.includes(amount) && amount > 0;
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Gets the display text for donation frequency
 */
export function getDonationFrequencyText(frequency: DonationFrequency): string {
  const texts: Record<DonationFrequency, string> = {
    daily: 'Every Day',
    weekly: 'Every Week',
    monthly: 'Every Month',
  };
  return texts[frequency];
}
