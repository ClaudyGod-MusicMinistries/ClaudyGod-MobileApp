import { pool } from '../db/pool';
import { emailQueue } from '../queues/emailQueue';
import { emailTransportInfo } from './email';

export interface EmailQueueStatus {
  smtpConfigured: boolean;
  smtpProvider: string;
  queueStats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  recentJobs: Array<{
    id: number;
    recipients: string[];
    subject: string;
    status: string;
    error: string | null;
    processedAt: string | null;
    lastAttemptAt: string | null;
  }>;
}

export const getEmailQueueStatus = async (): Promise<EmailQueueStatus> => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  const recentJobsResult = await pool.query(
    `SELECT id, recipients, subject, status, error, processed_at, last_attempt_at
     FROM email_jobs
     ORDER BY created_at DESC
     LIMIT 20`,
  );

  const recentJobs = recentJobsResult.rows.map((row: any) => ({
    id: row.id,
    recipients: Array.isArray(row.recipients) ? row.recipients : String(row.recipients).split(',').map((e: string) => e.trim()),
    subject: row.subject,
    status: row.status,
    error: row.error,
    processedAt: row.processed_at?.toISOString() || null,
    lastAttemptAt: row.last_attempt_at?.toISOString() || null,
  }));

  return {
    smtpConfigured: emailTransportInfo.enabled,
    smtpProvider: emailTransportInfo.provider,
    queueStats: {
      waiting,
      active,
      completed,
      failed,
      delayed,
    },
    recentJobs,
  };
};

export const getEmailJobDetails = async (jobId: number) => {
  const result = await pool.query(
    `SELECT *
     FROM email_jobs
     WHERE id = $1
     LIMIT 1`,
    [jobId],
  );

  return (result.rowCount ?? 0) > 0 ? result.rows[0] : null;
};
