import { pool } from '../../db/pool';
import { sendContentBroadcastNotification, type BroadcastNotificationResult } from '../../infra/push';
import type { BroadcastNotificationInput, ListCampaignsQuery } from './notifications.schema';

export interface CampaignRecord {
  id: string;
  title: string;
  body: string;
  category: string;
  contentId: string | null;
  contentTitle?: string | null;
  targetAudience: string;
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

export class NotificationsService {
  static async broadcast(
    input: BroadcastNotificationInput,
    adminUserId: string,
  ): Promise<BroadcastNotificationResult> {
    return sendContentBroadcastNotification({
      title: input.title,
      body: input.body,
      category: input.category,
      contentId: input.contentId,
      contentType: input.contentType,
      targetAudience: input.targetAudience,
      imageUrl: input.imageUrl,
      deepLinkUrl: input.deepLinkUrl,
      createdBy: adminUserId,
    });
  }

  static async listCampaigns(query: ListCampaignsQuery): Promise<{
    items: CampaignRecord[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const params: unknown[] = [];

    if (query.category) {
      params.push(query.category);
      whereClauses.push(`c.category = $${params.length}`);
    }

    if (query.targetAudience) {
      params.push(query.targetAudience);
      whereClauses.push(`c.target_audience = $${params.length}`);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRes = await pool.query<{ count: string }>(
      `SELECT count(*)::text as count FROM push_notification_campaigns c WHERE ${whereSql}`,
      params,
    );
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);

    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const rowsRes = await pool.query<{
      id: string;
      title: string;
      body: string;
      category: string;
      content_id: string | null;
      content_title: string | null;
      target_audience: string;
      image_url: string | null;
      deep_link_url: string | null;
      recipients_attempted: number;
      recipients_accepted: number;
      invalid_tokens_pruned: number;
      status: string;
      created_by: string | null;
      created_by_name: string | null;
      created_at: string;
    }>(
      `SELECT
         c.id, c.title, c.body, c.category, c.content_id,
         ci.title as content_title,
         c.target_audience, c.image_url, c.deep_link_url,
         c.recipients_attempted, c.recipients_accepted, c.invalid_tokens_pruned,
         c.status, c.created_by,
         u.display_name as created_by_name,
         c.created_at::text as created_at
       FROM push_notification_campaigns c
       LEFT JOIN content_items ci ON ci.id = c.content_id
       LEFT JOIN app_users u ON u.id = c.created_by
       WHERE ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params,
    );

    const items: CampaignRecord[] = rowsRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      category: row.category,
      contentId: row.content_id,
      contentTitle: row.content_title,
      targetAudience: row.target_audience,
      imageUrl: row.image_url,
      deepLinkUrl: row.deep_link_url,
      recipientsAttempted: row.recipients_attempted,
      recipientsAccepted: row.recipients_accepted,
      invalidTokensPruned: row.invalid_tokens_pruned,
      status: row.status,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getStats(): Promise<NotificationStats> {
    const [campaignAgg, userTokensRes, guestTokensRes] = await Promise.all([
      pool.query<{
        total_campaigns: string;
        total_attempted: string;
        total_accepted: string;
      }>(
        `SELECT
           count(*)::text as total_campaigns,
           coalesce(sum(recipients_attempted), 0)::text as total_attempted,
           coalesce(sum(recipients_accepted), 0)::text as total_accepted
         FROM push_notification_campaigns`,
      ),
      pool.query<{ count: string }>(
        `SELECT count(DISTINCT upt.expo_push_token)::text as count
         FROM user_push_tokens upt
         INNER JOIN app_users u ON u.id = upt.user_id
         WHERE u.is_active = TRUE`,
      ),
      pool.query<{ count: string }>(
        `SELECT count(DISTINCT mpt.expo_push_token)::text as count
         FROM mobile_installation_push_tokens mpt
         INNER JOIN mobile_installations mi ON mi.id = mpt.installation_id
         WHERE mi.status = 'active' AND mi.notifications_enabled = TRUE`,
      ),
    ]);

    const totalCampaigns = parseInt(campaignAgg.rows[0]?.total_campaigns ?? '0', 10);
    const totalAttempted = parseInt(campaignAgg.rows[0]?.total_attempted ?? '0', 10);
    const totalAccepted = parseInt(campaignAgg.rows[0]?.total_accepted ?? '0', 10);
    const registeredUserTokens = parseInt(userTokensRes.rows[0]?.count ?? '0', 10);
    const guestDeviceTokens = parseInt(guestTokensRes.rows[0]?.count ?? '0', 10);
    const activePushTokens = registeredUserTokens + guestDeviceTokens;
    const averageDeliveryRate = totalAttempted > 0 ? Math.round((totalAccepted / totalAttempted) * 100) : 100;

    return {
      totalCampaigns,
      totalRecipientsReached: totalAccepted,
      activePushTokens,
      registeredUserTokens,
      guestDeviceTokens,
      averageDeliveryRate,
    };
  }
}
