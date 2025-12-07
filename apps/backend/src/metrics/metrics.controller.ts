import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './index.js';

/**
 * Exposes Prometheus-compatible metrics for the backend service.
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * Returns the current metrics snapshot in plain text format.
   */
  @Get()
  async getMetrics(): Promise<string> {
    return this.metrics.getMetricsText();
  }
}
