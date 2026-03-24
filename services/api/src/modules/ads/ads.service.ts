import type { Pool, PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { isMissingDatabaseStructureError } from '../../lib/postgres';
import type { JwtClaims } from '../../utils/jwt';
import type { AdPlacementScreen } from '../appConfig/appConfig.schema';
import type { AdCampaign, AdCampaignStatus, CreateAdCampaignInput, UpdateAdCampaignInput } from './ads.types';

interface AdCampaignRow {
  id: string;
  name: string;
  placement: AdPlacementScreen;
  status: AdCampaignStatus;
  sponsor_name: string;
  headline: string;
  body_text: string;
  cta_label: string;
  cta_url: string;
  image_url: string | null;
  audience_tags: string[] | null;
  daily_budget_cents: number;
  weight: number;
  starts_at: string | Date | null;
  ends_at: string | Date | null;
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
}

const toIso = (value?: string | Date | null): string | undefined => (value ? new Date(value).toISOString() : undefined);

const normalizeTags = (tags?: string[]): string[] =>
  [...new Set((tags ?? []).map((item) => item.trim()).filter(Boolean))];

const toAdCampaign = (row: AdCampaignRow): AdCampaign => ({
  id: row.id,
  name: row.name,
  placement: row.placement,
  status: row.status,
  sponsorName: row.sponsor_name,
  headline: row.headline,
  body: row.body_text,
  ctaLabel: row.cta_label,
  ctaUrl: row.cta_url,
  imageUrl: row.image_url ?? undefined,
  audienceTags: row.audience_tags ?? [],
  dailyBudgetCents: Number(row.daily_budget_cents || 0),
  weight: Number(row.weight || 100),
  startsAt: toIso(row.starts_at),
  endsAt: toIso(row.ends_at),
  metadata: row.metadata ?? {},
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

async function loadAdCampaignRow(db: Pool | PoolClient, id: string): Promise<AdCampaignRow | null> {
  const result = await db.query<AdCampaignRow>(
    `SELECT id, name, placement, status, sponsor_name, headline, body_text, cta_label, cta_url,
            image_url, audience_tags, daily_budget_cents, weight, starts_at, ends_at, metadata,
            created_at, updated_at
       FROM ad_campaigns
      WHERE id = $1
      LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function listAdCampaigns(query: {
  status?: AdCampaignStatus;
  placement?: AdPlacementScreen;
}): Promise<AdCampaign[]> {
  const values: unknown[] = [];
  const where: string[] = [];

  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }
  if (query.placement) {
    values.push(query.placement);
    where.push(`placement = $${values.length}`);
  }

  let result;
  try {
    result = await pool.query<AdCampaignRow>(
      `SELECT id, name, placement, status, sponsor_name, headline, body_text, cta_label, cta_url,
              image_url, audience_tags, daily_budget_cents, weight, starts_at, ends_at, metadata,
              created_at, updated_at
         FROM ad_campaigns
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY
          CASE status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END,
          updated_at DESC`,
      values,
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return [];
    }
    throw error;
  }

  return result.rows.map(toAdCampaign);
}

export async function listActiveAdCampaignsForPlacement(placement: AdPlacementScreen, limit = 1): Promise<AdCampaign[]> {
  let result;
  try {
    result = await pool.query<AdCampaignRow>(
      `SELECT id, name, placement, status, sponsor_name, headline, body_text, cta_label, cta_url,
              image_url, audience_tags, daily_budget_cents, weight, starts_at, ends_at, metadata,
              created_at, updated_at
         FROM ad_campaigns
        WHERE placement = $1
          AND status = 'active'
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY weight DESC, updated_at DESC
        LIMIT $2`,
      [placement, limit],
    );
  } catch (error) {
    if (isMissingDatabaseStructureError(error)) {
      return [];
    }
    throw error;
  }

  return result.rows.map(toAdCampaign);
}

export async function createAdCampaign(actor: JwtClaims, input: CreateAdCampaignInput): Promise<AdCampaign> {
  const result = await pool.query<AdCampaignRow>(
    `INSERT INTO ad_campaigns (
        name, placement, status, sponsor_name, headline, body_text, cta_label, cta_url,
        image_url, audience_tags, daily_budget_cents, weight, starts_at, ends_at, metadata,
        created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15::jsonb,
        $16, $16
      )
      RETURNING id, name, placement, status, sponsor_name, headline, body_text, cta_label, cta_url,
                image_url, audience_tags, daily_budget_cents, weight, starts_at, ends_at, metadata,
                created_at, updated_at`,
    [
      input.name.trim(),
      input.placement,
      input.status,
      input.sponsorName.trim(),
      input.headline.trim(),
      input.body.trim(),
      input.ctaLabel.trim(),
      input.ctaUrl.trim(),
      input.imageUrl?.trim() || null,
      normalizeTags(input.audienceTags),
      input.dailyBudgetCents ?? 0,
      input.weight ?? 100,
      input.startsAt ?? null,
      input.endsAt ?? null,
      JSON.stringify(input.metadata ?? {}),
      actor.sub,
    ],
  );

  return toAdCampaign(result.rows[0]!);
}

export async function updateAdCampaign(actor: JwtClaims, id: string, input: UpdateAdCampaignInput): Promise<AdCampaign> {
  const existing = await loadAdCampaignRow(pool, id);
  if (!existing) {
    throw new HttpError(404, 'Ad campaign not found');
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  const add = (field: string, value: unknown, cast = '') => {
    values.push(value);
    updates.push(`${field} = $${values.length}${cast}`);
  };

  if (input.name !== undefined) add('name', input.name.trim());
  if (input.placement !== undefined) add('placement', input.placement);
  if (input.status !== undefined) add('status', input.status);
  if (input.sponsorName !== undefined) add('sponsor_name', input.sponsorName.trim());
  if (input.headline !== undefined) add('headline', input.headline.trim());
  if (input.body !== undefined) add('body_text', input.body.trim());
  if (input.ctaLabel !== undefined) add('cta_label', input.ctaLabel.trim());
  if (input.ctaUrl !== undefined) add('cta_url', input.ctaUrl.trim());
  if (input.imageUrl !== undefined) add('image_url', input.imageUrl?.trim() || null);
  if (input.audienceTags !== undefined) add('audience_tags', normalizeTags(input.audienceTags));
  if (input.dailyBudgetCents !== undefined) add('daily_budget_cents', input.dailyBudgetCents);
  if (input.weight !== undefined) add('weight', input.weight);
  if (input.startsAt !== undefined) add('starts_at', input.startsAt || null);
  if (input.endsAt !== undefined) add('ends_at', input.endsAt || null);
  if (input.metadata !== undefined) add('metadata', JSON.stringify(input.metadata ?? {}), '::jsonb');

  values.push(actor.sub);
  updates.push(`updated_by = $${values.length}`);
  updates.push('updated_at = NOW()');
  values.push(id);

  const result = await pool.query<AdCampaignRow>(
    `UPDATE ad_campaigns
        SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, name, placement, status, sponsor_name, headline, body_text, cta_label, cta_url,
                image_url, audience_tags, daily_budget_cents, weight, starts_at, ends_at, metadata,
                created_at, updated_at`,
    values,
  );

  return toAdCampaign(result.rows[0]!);
}
