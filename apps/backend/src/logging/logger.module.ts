import { Global, Module, Logger, Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

type CorrelatedRequest = Request & { correlationId?: string };

@Injectable({ scope: Scope.REQUEST })
export class CorrelatedLogger extends Logger {
  constructor(@Inject(REQUEST) private readonly req: CorrelatedRequest) {
    super('App', { timestamp: true });
  }

  private withCid(message: unknown): string {
    const cid = this.req.correlationId;
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    return cid ? `[cid=${cid}] ${msg}` : msg;
  }

  override log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(this.withCid(message), ...(optionalParams as []));
  }
  override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(this.withCid(message), ...(optionalParams as []));
  }
  override warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(this.withCid(message), ...(optionalParams as []));
  }
  override debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(this.withCid(message), ...(optionalParams as []));
  }
  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    super.verbose(this.withCid(message), ...(optionalParams as []));
  }
}

@Global()
@Module({
  providers: [CorrelatedLogger],
  exports: [CorrelatedLogger],
})
export class LoggerModule {}
