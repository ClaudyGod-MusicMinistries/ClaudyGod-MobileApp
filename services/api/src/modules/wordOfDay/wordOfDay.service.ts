import type { JwtClaims } from '../../utils/jwt';
import { pool } from '../../db/pool';
import { emailQueue } from '../../queues/emailQueue';

type WordStatus = 'draft' | 'published' | 'archived';

interface WordRow {
  id: string;
  title: string;
  passage: string;
  verse_text: string;
  reflection_text: string;
  message_date: string | Date;
  status: WordStatus;
  notify_email: boolean;
  published_at: string | Date | null;
  notified_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface EmailRecipientRow {
  email: string;
}

const toIso = (value: string | Date | null): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

const toDateOnly = (value: string | Date): string => {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const chunk = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const mapWord = (row: WordRow) => ({
  id: row.id,
  title: row.title,
  passage: row.passage,
  verse: row.verse_text,
  reflection: row.reflection_text,
  messageDate: toDateOnly(row.message_date),
  status: row.status,
  notifyEmail: row.notify_email,
  publishedAt: toIso(row.published_at),
  notifiedAt: toIso(row.notified_at),
  createdAt: toIso(row.created_at)!,
  updatedAt: toIso(row.updated_at)!,
});

async function enqueueWordOfDayEmailNotifications(word: ReturnType<typeof mapWord>): Promise<{
  recipientCount: number;
  jobsQueued: number;
}> {
  const recipientsResult = await pool.query<EmailRecipientRow>(
    `SELECT DISTINCT u.email
     FROM app_users u
     LEFT JOIN user_preferences p ON p.user_id = u.id
     WHERE u.role = 'CLIENT'
       AND u.is_active = TRUE
       AND u.email IS NOT NULL
       AND COALESCE(p.notifications_enabled, TRUE) = TRUE`,
  );

  const recipients = recipientsResult.rows
    .map((row) => row.email.trim().toLowerCase())
    .filter(Boolean);

  if (recipients.length === 0) {
    return { recipientCount: 0, jobsQueued: 0 };
  }

  let jobsQueued = 0;
  for (const recipientChunk of chunk(recipients, 200)) {
    const emailInsert = await pool.query<{ id: number }>(
      `INSERT INTO email_jobs (job_type, recipients, subject, text_body, html_body, status, payload)
       VALUES ($1, $2::text[], $3, $4, $5, 'pending', $6::jsonb)
       RETURNING id`,
      [
        'word_of_day_published',
        recipientChunk,
        `${word.title}: ${word.passage}`,
        [
          `${word.title}`,
          '',
          `${word.passage}`,
          word.verse,
          '',
          word.reflection,
        ].join('\n'),
        `<p><strong>${escapeHtml(word.title)}</strong></p><p><strong>${escapeHtml(word.passage)}</strong></p><blockquote>${escapeHtml(
          word.verse,
        )}</blockquote><p>${escapeHtml(word.reflection).replace(/\n/g, '<br/>')}</p>`,
        JSON.stringify({
          wordOfDayId: word.id,
          messageDate: word.messageDate,
          recipientCount: recipientChunk.length,
        }),
      ],
    );

    const emailJobId = emailInsert.rows[0]!.id;
    const queueJob = await emailQueue.add('email.word_of_day_published', { emailJobId });

    await pool.query(
      `UPDATE email_jobs
       SET queue_job_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [emailJobId, String(queueJob.id)],
    );

    jobsQueued += 1;
  }

  return {
    recipientCount: recipients.length,
    jobsQueued,
  };
}

export const getMobileWordOfDay = async (): Promise<{
  word: ReturnType<typeof mapWord> | null;
}> => {
  const result = await pool.query<WordRow>(
    `SELECT *
     FROM word_of_day_entries
     WHERE status = 'published'
     ORDER BY message_date DESC, updated_at DESC
     LIMIT 1`,
  );

  if (result.rowCount === 0) {
    return { word: null };
  }

  return { word: mapWord(result.rows[0]!) };
};

export const getAdminWordOfDayDashboard = async (params?: {
  limit?: number;
}): Promise<{
  current: ReturnType<typeof mapWord> | null;
  items: ReturnType<typeof mapWord>[];
}> => {
  const limit = Math.min(Math.max(params?.limit ?? 20, 1), 60);

  const result = await pool.query<WordRow>(
    `SELECT *
     FROM word_of_day_entries
     ORDER BY message_date DESC, updated_at DESC
     LIMIT $1`,
    [limit],
  );

  const items = result.rows.map(mapWord);
  const current = items.find((item) => item.status === 'published') ?? items[0] ?? null;

  return { current, items };
};

export const upsertWordOfDayEntry = async (params: {
  actor: JwtClaims;
  input: {
    title?: string;
    passage: string;
    verse: string;
    reflection: string;
    messageDate?: string;
    status: WordStatus;
    notifySubscribers: boolean;
  };
}): Promise<{
  entry: ReturnType<typeof mapWord>;
  notifications: { recipientCount: number; jobsQueued: number };
}> => {
  const messageDate = params.input.messageDate ?? toDateOnly(new Date());
  const title = params.input.title?.trim() || 'Word for Today';

  const result = await pool.query<WordRow>(
    `INSERT INTO word_of_day_entries (
       title, passage, verse_text, reflection_text, message_date, status, notify_email,
       published_at, created_by, updated_by
     )
     VALUES (
       $1, $2, $3, $4, $5::date, $6, $7,
       CASE WHEN $6 = 'published' THEN NOW() ELSE NULL END,
       $8, $8
     )
     ON CONFLICT (message_date)
     DO UPDATE SET
       title = EXCLUDED.title,
       passage = EXCLUDED.passage,
       verse_text = EXCLUDED.verse_text,
       reflection_text = EXCLUDED.reflection_text,
       status = EXCLUDED.status,
       notify_email = EXCLUDED.notify_email,
       published_at = CASE
         WHEN EXCLUDED.status = 'published' THEN COALESCE(word_of_day_entries.published_at, NOW())
         ELSE word_of_day_entries.published_at
       END,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING *`,
    [
      title,
      params.input.passage.trim(),
      params.input.verse.trim(),
      params.input.reflection.trim(),
      messageDate,
      params.input.status,
      params.input.notifySubscribers,
      params.actor.sub,
    ],
  );

  const entry = mapWord(result.rows[0]!);
  let notifications = { recipientCount: 0, jobsQueued: 0 };

  if (params.input.notifySubscribers && entry.status === 'published') {
    notifications = await enqueueWordOfDayEmailNotifications(entry);

    await pool.query(
      `UPDATE word_of_day_entries
       SET notified_at = NOW(), notify_email = TRUE, updated_at = NOW(), updated_by = $2
       WHERE id = $1`,
      [entry.id, params.actor.sub],
    );
  }

  const refreshed = await pool.query<WordRow>(
    `SELECT * FROM word_of_day_entries WHERE id = $1 LIMIT 1`,
    [entry.id],
  );

  return {
    entry: mapWord(refreshed.rows[0]!),
    notifications,
  };
};
