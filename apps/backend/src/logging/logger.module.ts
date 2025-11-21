import { Global, Module, Injectable, Scope, Inject, LoggerService } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

type CorrelatedRequest = Request & { correlationId?: string };

@Injectable({ scope: Scope.REQUEST })
export class CorrelatedLogger implements LoggerService {
  constructor(@Inject(REQUEST) private readonly req: CorrelatedRequest) {}

  private toPlain(value: unknown): unknown {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    return value;
  }

  private write(
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const cid = this.req.correlationId;
    const payload: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      cid: cid ?? undefined,
      msg: this.toPlain(message),
    };
    if (optionalParams.length > 0) {
      payload.meta = optionalParams.map((v) => this.toPlain(v));
    }
    try {
      process.stdout.write(`${JSON.stringify(payload)}\n`);
    } catch {
      // eslint-disable-next-line no-console
      console.log('[CorrelatedLogger-fallback]', level, cid, message, ...optionalParams);
    }
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('trace', message, optionalParams);
  }
}
@Global()
@Module({
  providers: [CorrelatedLogger],
  exports: [CorrelatedLogger],
})
export class LoggerModule {}
