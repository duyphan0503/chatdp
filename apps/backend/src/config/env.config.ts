import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validate.js';

// Preserve the default .env file resolution mechanism
function resolveEnvPaths(): string[] {
  return ['apps/backend/.env', '.env'];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvPaths(),
      // Fail fast via Zod schema validation
      validate,
    }),
  ],
})
export class EnvConfigModule {}
