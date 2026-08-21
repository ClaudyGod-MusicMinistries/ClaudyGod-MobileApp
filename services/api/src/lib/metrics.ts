import { register, Counter, Histogram, Gauge } from 'prom-client';
import { pool } from '../db/pool';

register.setDefaultLabels({ service: 'claudygod-api' });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

export const activeStreamsGauge = new Gauge({
  name: 'active_streams_total',
  help: 'Number of currently active playback streams',
});

export const queueDepthGauge = new Gauge({
  name: 'queue_depth_total',
  help: 'Number of pending jobs per queue',
  labelNames: ['queue_name'] as const,
});

export const cacheHitTotal = new Counter({
  name: 'cache_operations_total',
  help: 'Cache hit/miss counters per namespace',
  labelNames: ['namespace', 'result'] as const,
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'PostgreSQL query execution duration in milliseconds',
  labelNames: ['operation'] as const,
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
});

export const wsConnectionsGauge = new Gauge({
  name: 'websocket_connections_total',
  help: 'Number of active WebSocket connections',
});

export const rateLimitRejectedTotal = new Counter({
  name: 'rate_limit_rejected_total',
  help: 'Number of requests rejected by a rate limiter, by limiter name',
  labelNames: ['limiter'] as const,
});

export const durableJobsGauge = new Gauge({
  name: 'durable_jobs_total',
  help: 'Durable operational jobs by kind and database state',
  labelNames: ['job_kind', 'status'] as const,
});

export const uploadTrustGauge = new Gauge({
  name: 'upload_sessions_trust_total',
  help: 'Admin upload sessions by security trust state',
  labelNames: ['trust_status'] as const,
});

export const oldestPendingJobAgeGauge = new Gauge({
  name: 'durable_job_oldest_pending_age_seconds',
  help: 'Age in seconds of the oldest pending job by kind',
  labelNames: ['job_kind'] as const,
});

export async function collectOperationalMetrics(): Promise<void> {
  const jobs = await pool.query<{ kind: string; status: string; count: string; oldest_age: string | null }>(`
    SELECT kind, status, COUNT(*)::text AS count,
           EXTRACT(EPOCH FROM NOW() - MIN(created_at))::text AS oldest_age
    FROM (
      SELECT 'content'::text kind, status, created_at FROM content_jobs
      UNION ALL SELECT 'email', status, created_at FROM email_jobs
      UNION ALL SELECT 'media', status, created_at FROM media_processing_jobs
    ) j GROUP BY kind, status
  `);
  durableJobsGauge.reset();
  oldestPendingJobAgeGauge.reset();
  for (const row of jobs.rows) {
    durableJobsGauge.set({ job_kind: row.kind, status: row.status }, Number(row.count));
    if (row.status === 'pending') oldestPendingJobAgeGauge.set({ job_kind: row.kind }, Number(row.oldest_age ?? 0));
  }

  const uploads = await pool.query<{ trust_status: string; count: string }>(
    `SELECT trust_status, COUNT(*)::text AS count FROM upload_sessions WHERE channel = 'admin' GROUP BY trust_status`,
  );
  uploadTrustGauge.reset();
  for (const row of uploads.rows) uploadTrustGauge.set({ trust_status: row.trust_status }, Number(row.count));
}

export async function getMetricsOutput(): Promise<string> {
  return register.metrics();
}

export const metricsContentType = register.contentType;
