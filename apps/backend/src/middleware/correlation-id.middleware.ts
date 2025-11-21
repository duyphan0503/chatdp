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
    const incomingHeader = req.headers['x-request-id'] ?? req.headers['x-correlation-id'];
    const incoming =
      typeof incomingHeader === 'string' && incomingHeader.trim().length > 0
        ? incomingHeader
        : undefined;
    const id = incoming ?? randomUUID();
    interface CorrelatedRequest extends Request {
      correlationId?: string;
    }
    (req as CorrelatedRequest).correlationId = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
