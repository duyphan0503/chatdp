import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.schema.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { PrismaService } from './prisma/prisma.service.js';

/**
 * Application entry point for the ChatDP backend.
 *
 * - Creates the Nest application with buffered logs.
 * - Applies global exception filters and shared HTTP configuration.
 * - Enables graceful shutdown for Prisma connections.
 * - Conditionally exposes Swagger UI under /api/docs in non-production envs.
 * - Binds the HTTP server to the configured PORT and logs the effective base URL.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  configureApp(app);

  const config = app.get(ConfigService<Env, true>);
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const nodeEnv = config.get('NODE_ENV', { infer: true });

  // Swagger / OpenAPI documentation (disabled in production)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ChatDP API')
      .setDescription('HTTP API for ChatDP backend')
      .setVersion('0.1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'bearerAuth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    // Expose Swagger UI under /api/docs (respecting global prefix)
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      useGlobalPrefix: true,
    });
  }

  const port = config.get('PORT', { infer: true });

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  const url = await app.getUrl();
  const apiBaseUrl = config.get('API_BASE_URL', { infer: true });
  logger.log(`Backend listening on ${apiBaseUrl ?? url}`);
}

void bootstrap();
