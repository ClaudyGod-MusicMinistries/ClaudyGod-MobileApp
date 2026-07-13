import { register, Counter, Histogram, Gauge } from 'prom-client';

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

export async function getMetricsOutput(): Promise<string> {
  return register.metrics();
}

export const metricsContentType = register.contentType;
