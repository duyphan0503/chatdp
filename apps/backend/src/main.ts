import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);

  const envPort = process.env.PORT;
  const parsed = envPort !== undefined ? Number(envPort) : NaN;
  const port = Number.isFinite(parsed) ? parsed : 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  const url = await app.getUrl();
  logger.log(`Backend listening on ${url}`);
}
void bootstrap();
