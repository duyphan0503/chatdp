import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validate.js';

// Giữ nguyên cơ chế chọn file .env
function resolveEnvPaths(): string[] {
  return ['apps/backend/.env', '.env'];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvPaths(),
      // Fail-fast qua Zod schema
      validate,
    }),
  ],
})
export class EnvConfigModule {}
