import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { messageOutboxProjectorRunsTotal } from '../metrics/index.js';
import {
  MESSAGES_READ_MODEL_STORE,
  MongoMessagesReadModelStore,
  NoopMessagesReadModelStore,
  type MessagesReadModelStore,
} from './messages-read-model.store.js';
import { MessageOutboxProjector } from './message-outbox.projector.js';

@Injectable()
export class MessageOutboxProjectorRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageOutboxProjectorRunner.name);

  private intervalId: NodeJS.Timeout | null = null;

  private isRunning = false;
  private enabled = false;
  private intervalMs = 0;
  private batchSize = 0;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly projector: MessageOutboxProjector,
    @Inject(MESSAGES_READ_MODEL_STORE)
    private readonly store: MessagesReadModelStore,
  ) {}

  onModuleInit(): void {
    const useMongo = this.config.get('USE_MONGO_READ_MODEL', { infer: true });
    const projectorEnabled = this.config.get('MONGO_PROJECTOR_ENABLED', { infer: true });

    if (!useMongo) {
      this.logger.log('USE_MONGO_READ_MODEL=false; MessageOutboxProjectorRunner disabled.');
      return;
    }

    if (!projectorEnabled) {
      this.logger.log('MONGO_PROJECTOR_ENABLED=false; MessageOutboxProjectorRunner disabled.');
      return;
    }

    if (this.store instanceof NoopMessagesReadModelStore) {
      this.logger.log(
        'MESSAGES_READ_MODEL_STORE is NoopMessagesReadModelStore; projector runner will not start.',
      );
      return;
    }

    if (!(this.store instanceof MongoMessagesReadModelStore)) {
      // Safety guard: only run when we have a concrete Mongo read model implementation.
      this.logger.warn(
        'MESSAGES_READ_MODEL_STORE is not a MongoMessagesReadModelStore; projector runner disabled.',
      );
      return;
    }

    this.intervalMs = this.config.get('MONGO_PROJECTOR_INTERVAL_MS', { infer: true });
    this.batchSize = this.config.get('MONGO_PROJECTOR_BATCH_SIZE', { infer: true });

    if (!Number.isFinite(this.intervalMs) || this.intervalMs <= 0) {
      this.logger.warn(
        `Invalid MONGO_PROJECTOR_INTERVAL_MS=${String(
          this.intervalMs,
        )}; projector runner will not start.`,
      );
      return;
    }

    if (!Number.isFinite(this.batchSize) || this.batchSize <= 0) {
      this.logger.warn(
        `Invalid MONGO_PROJECTOR_BATCH_SIZE=${String(
          this.batchSize,
        )}; projector runner will not start.`,
      );
      return;
    }

    this.enabled = true;
    this.intervalId = setInterval(() => void this.tick(), this.intervalMs);

    this.logger.log(
      `MessageOutboxProjectorRunner started with interval=${this.intervalMs}ms, batchSize=${this.batchSize}.`,
    );
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('MessageOutboxProjectorRunner stopped.');
    }
  }

  /**
   * Exposed for tests: run a single projection tick immediately.
   */
  async runOnce(): Promise<void> {
    await this.tick();
  }

  private async tick(): Promise<void> {
    if (!this.enabled) return;
    if (this.isRunning) {
      this.logger.debug('Previous projector run is still in progress; skipping this tick.');
      return;
    }

    this.isRunning = true;
    try {
      const { processed, failed } = await this.projector.processBatch(this.batchSize);

      if (processed > 0 || failed > 0) {
        this.logger.debug(
          `MessageOutboxProjector processed batch: processed=${processed}, failed=${failed}.`,
        );
      }

      messageOutboxProjectorRunsTotal.labels('ok').inc();
    } catch (err) {
      this.logger.error(`MessageOutboxProjectorRunner tick failed: ${String(err)}`);
      messageOutboxProjectorRunsTotal.labels('error').inc();
    } finally {
      this.isRunning = false;
    }
  }
}
