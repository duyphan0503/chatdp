import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// noinspection JSUnusedGlobalSymbols - used by Prisma CLI via convention
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
