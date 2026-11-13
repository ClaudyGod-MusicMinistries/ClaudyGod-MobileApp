import { defineStore } from 'pinia';
import { ref } from 'vue';
import { client } from '@/api/client';

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  category: 'new_release' | 'ministry_update' | 'live_service' | 'daily_devotional' | 'announcement';
  contentId: string | null;
  contentTitle?: string | null;
  targetAudience: 'all' | 'registered' | 'guests';
  imageUrl: string | null;
  deepLinkUrl: string | null;
  recipientsAttempted: number;
  recipientsAccepted: number;
  invalidTokensPruned: number;
  status: string;
  createdBy: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface NotificationStats {
  totalCampaigns: number;
  totalRecipientsReached: number;
  activePushTokens: number;
  registeredUserTokens: number;
  guestDeviceTokens: number;
  averageDeliveryRate: number;
}

export interface BroadcastPayload {
  title: string;
  body: string;
  category: 'new_release' | 'ministry_update' | 'live_service' | 'daily_devotional' | 'announcement';
  contentId?: string | null;
  contentType?: string | null;
  targetAudience: 'all' | 'registered' | 'guests';
  imageUrl?: string;
  deepLinkUrl?: string;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const campaigns = ref<PushCampaign[]>([]);
  const stats = ref<NotificationStats>({
    totalCampaigns: 0,
    totalRecipientsReached: 0,
    activePushTokens: 0,
    registeredUserTokens: 0,
    guestDeviceTokens: 0,
    averageDeliveryRate: 100,
  });
  const loading = ref(false);
  const broadcasting = ref(false);
  const total = ref(0);
  const currentPage = ref(1);

  async function fetchStats(): Promise<void> {
    try {
      const res = await client.get<{ success: boolean; data: NotificationStats }>('/v1/admin/notifications/stats');
      if (res.data?.data) {
        stats.value = res.data.data;
      }
    } catch {
      // Non-blocking fallback
    }
  }

  async function fetchCampaigns(page = 1, category?: string): Promise<void> {
    loading.value = true;
    try {
      const res = await client.get<{
        success: boolean;
        data: PushCampaign[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>('/v1/admin/notifications/campaigns', {
        params: { page, limit: 20, category: category || undefined },
      });
      campaigns.value = res.data.data || [];
      total.value = res.data.pagination?.total || 0;
      currentPage.value = page;
    } finally {
      loading.value = false;
    }
  }

  async function sendBroadcast(payload: BroadcastPayload): Promise<{ campaignId: string; accepted: number; attempted: number }> {
    broadcasting.value = true;
    try {
      const res = await client.post<{
        success: boolean;
        data: { campaignId: string; accepted: number; attempted: number; invalidTokens: number };
        message: string;
      }>('/v1/admin/notifications/broadcast', payload);

      await Promise.all([fetchStats(), fetchCampaigns(1)]);
      return res.data.data;
    } finally {
      broadcasting.value = false;
    }
  }

  return {
    campaigns,
    stats,
    loading,
    broadcasting,
    total,
    currentPage,
    fetchStats,
    fetchCampaigns,
    sendBroadcast,
  };
});
