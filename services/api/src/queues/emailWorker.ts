import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { sendEmail } from '../infra/email';
import { env } from '../config/env';
import { logger } from '../lib/logger';
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
         SET status = 'processing', last_attempt_at = NOW()
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

        logger.info('Sending email', { emailJobId, recipients });

        const delivery = await sendEmail({
          to: recipients,
          subject: row.subject,
          text: row.text_body,
          html: row.html_body ?? undefined,
        });

        logger.info('Email delivered', { emailJobId, messageId: delivery.messageId });

        await pool.query(
          `UPDATE email_jobs
           SET status = 'completed', sent_message_id = $2, processed_at = NOW()
           WHERE id = $1`,
          [emailJobId, delivery.messageId ?? null],
        );

        return { success: true };
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown email worker error';
        logger.error('Email delivery failed', { emailJobId, reason });
        await markEmailJobFailed(emailJobId, reason);
        throw error;
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
        enableAutoPipelining: true,
      },
      concurrency: 4,
    },
  );

  worker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job?.id });
  });

  worker.on('failed', (job, error) => {
    logger.error('Email job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
};
