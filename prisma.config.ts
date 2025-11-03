import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Загрузка кастомного .env файла
config({ path: path.join(__dirname, 'envs', '.env.development') });

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  engine: 'classic',
  datasource: {
    url: env<Env>('DATABASE_URL'),
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx ./prisma/seed.ts', // или 'ts-node'
  },
});
