import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// For this project, we keep env files simple:
// - .env.example is committed as a template
// - .env is used locally for both development and tests
function resolveEnvPaths(): string[] {
  // Support both repo-root and app-root execution contexts
  return ['apps/backend/.env', '.env'];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvPaths(),
    }),
  ],
})
export class EnvConfigModule {}
