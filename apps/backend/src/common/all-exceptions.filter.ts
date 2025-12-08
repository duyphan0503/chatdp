import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

function toErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorCode = toErrorCode(status);

    const path = req?.url ?? '';
    const timestamp = new Date().toISOString();

    let message: string;
    if (status === 500) {
      message = 'Internal server error';
    } else if (isHttp) {
      message = exception.message;
    } else {
      message = 'Unexpected error';
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error: errorCode,
      message,
      path,
      timestamp,
    };

    this.logger.error('Unhandled exception', {
      error:
        exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      status,
      path,
    });

    res.status(status).json(body);
  }
}
