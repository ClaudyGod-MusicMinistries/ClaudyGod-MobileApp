import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { sendEmail } from '../infra/email';
import { redis } from '../infra/redis';
import { EMAIL_QUEUE_NAME, type EmailQueuePayload } from './emailQueue';

interface EmailJobRow {
  id: number;
  recipients: string[] | string;
  subject: string;
  text_body: string;
  html_body: string | null;
}

const markEmailJobFailed = async (emailJobId: number, reason: string): Promise<void> => {
  await pool.query(
    `UPDATE email_jobs
     SET status = 'failed', error = $2, processed_at = NOW()
     WHERE id = $1`,
    [emailJobId, reason],
  );
};

export const startEmailWorker = (): Worker<EmailQueuePayload> => {
  const worker = new Worker<EmailQueuePayload>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { emailJobId } = job.data;

      await pool.query(
        `UPDATE email_jobs
         SET status = 'processing'
         WHERE id = $1`,
        [emailJobId],
      );

      try {
        const result = await pool.query<EmailJobRow>(
          `SELECT id, recipients, subject, text_body, html_body
           FROM email_jobs
           WHERE id = $1
           LIMIT 1`,
          [emailJobId],
        );

        if (result.rowCount === 0) {
          throw new Error(`Email job ${emailJobId} not found`);
        }

        const row = result.rows[0];
        const recipients = Array.isArray(row.recipients)
          ? row.recipients
          : String(row.recipients)
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);

        await sendEmail({
          to: recipients,
          subject: row.subject,
          text: row.text_body,
          html: row.html_body ?? undefined,
        });

        await pool.query(
          `UPDATE email_jobs
           SET status = 'completed', processed_at = NOW()
           WHERE id = $1`,
          [emailJobId],
        );

        return { success: true };
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown email worker error';
        await markEmailJobFailed(emailJobId, reason);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 4,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[email-worker] Completed job ${job?.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[email-worker] Failed job ${job?.id}: ${error.message}`);
  });

  return worker;
};
