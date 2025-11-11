import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Single registry for the application
export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

// HTTP request duration histogram
export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});
metricsRegistry.registerMetric(httpRequestDurationSeconds);

// HTTP requests total counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
metricsRegistry.registerMetric(httpRequestsTotal);

// WebSocket events counter
export const wsEventsTotal = new Counter({
  name: 'ws_events_total',
  help: 'Total WebSocket events handled',
  labelNames: ['event'],
});
metricsRegistry.registerMetric(wsEventsTotal);

// Prisma query duration histogram
export const prismaQueryDurationSeconds = new Histogram({
  name: 'prisma_query_duration_seconds',
  help: 'Prisma query duration in seconds',
  labelNames: ['model', 'action'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});
metricsRegistry.registerMetric(prismaQueryDurationSeconds);

@Injectable()
export class MetricsService {
  async getMetricsText(): Promise<string> {
    return metricsRegistry.metrics();
  }
}
