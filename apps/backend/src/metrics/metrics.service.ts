import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

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

// HTTP in-flight gauge
export const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
});
metricsRegistry.registerMetric(httpRequestsInFlight);

// WebSocket events counter
export const wsEventsTotal = new Counter({
  name: 'ws_events_total',
  help: 'Total WebSocket events handled',
  labelNames: ['event'],
});
metricsRegistry.registerMetric(wsEventsTotal);

// Message search (Phase 10) - high level metrics
export const messageSearchRequestsTotal = new Counter({
  name: 'message_search_requests_total',
  help: 'Total number of message search requests',
  labelNames: ['status'], // ok | empty_query | error
});
metricsRegistry.registerMetric(messageSearchRequestsTotal);

export const messageSearchDurationSeconds = new Histogram({
  name: 'message_search_duration_seconds',
  help: 'Message search duration in seconds',
  labelNames: ['status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
});
metricsRegistry.registerMetric(messageSearchDurationSeconds);

// Call signaling counters (Phase 8)
export const callsInitiatedTotal = new Counter({
  name: 'calls_initiated_total',
  help: 'Total number of call sessions started',
  labelNames: ['type'],
});
metricsRegistry.registerMetric(callsInitiatedTotal);

export const callsAcceptedTotal = new Counter({
  name: 'calls_accepted_total',
  help: 'Total number of calls accepted by callee',
});
metricsRegistry.registerMetric(callsAcceptedTotal);

export const callsRejectedTotal = new Counter({
  name: 'calls_rejected_total',
  help: 'Total number of calls explicitly rejected by a participant',
});
metricsRegistry.registerMetric(callsRejectedTotal);

export const callsMissedTotal = new Counter({
  name: 'calls_missed_total',
  help: 'Total number of calls that timed out while ringing',
});
metricsRegistry.registerMetric(callsMissedTotal);

// Prisma query duration histogram
export const prismaQueryDurationSeconds = new Histogram({
  name: 'prisma_query_duration_seconds',
  help: 'Prisma query duration in seconds',
  labelNames: ['model', 'action'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});
metricsRegistry.registerMetric(prismaQueryDurationSeconds);

// Prisma queries total counter
export const prismaQueriesTotal = new Counter({
  name: 'prisma_queries_total',
  help: 'Total number of Prisma queries',
  labelNames: ['model', 'action', 'status'],
});
metricsRegistry.registerMetric(prismaQueriesTotal);

// Polyglot persistence (Mongo read model) - projector + read path
export const messageOutboxProjectorRunsTotal = new Counter({
  name: 'message_outbox_projector_runs_total',
  help: 'Total number of MessageOutbox projector runs',
  labelNames: ['status'], // ok | error
});
metricsRegistry.registerMetric(messageOutboxProjectorRunsTotal);

export const messageOutboxItemsProcessedTotal = new Counter({
  name: 'message_outbox_items_processed_total',
  help: 'Total number of MessageOutbox items processed by the projector',
  labelNames: ['outcome'], // processed | failed
});
metricsRegistry.registerMetric(messageOutboxItemsProcessedTotal);

export const messageOutboxPending = new Gauge({
  name: 'message_outbox_pending',
  help: 'Number of pending MessageOutbox rows waiting to be projected to the read model',
});
metricsRegistry.registerMetric(messageOutboxPending);

export const messageTimelineReadsTotal = new Counter({
  name: 'message_timeline_reads_total',
  help: 'Total number of message timeline read operations',
  labelNames: ['source'], // postgres | mongo
});
metricsRegistry.registerMetric(messageTimelineReadsTotal);

@Injectable()
export class MetricsService {
  async getMetricsText(): Promise<string> {
    return metricsRegistry.metrics();
  }
}
