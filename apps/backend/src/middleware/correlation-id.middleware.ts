import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare module 'http' {
  interface IncomingMessage {
    correlationId?: string;
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = (req.headers['x-request-id'] || req.headers['x-correlation-id']) as string | undefined;
    const id = incoming && String(incoming).trim().length > 0 ? String(incoming) : randomUUID();
    (req as any).correlationId = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
