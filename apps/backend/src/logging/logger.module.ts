import { Global, Module, Logger } from '@nestjs/common';

export class CorrelatedLogger extends Logger {
  // Placeholder for future correlationId-aware logger
}

@Global()
@Module({
  providers: [
    {
      provide: CorrelatedLogger,
      useFactory: (): CorrelatedLogger => new CorrelatedLogger('App', { timestamp: true }),
    },
  ],
  exports: [CorrelatedLogger],
})
export class LoggerModule {}
