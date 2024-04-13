import { loadEnvConfig } from "@next/env";
import type { Config } from 'drizzle-kit';

const dir = process.cwd();
loadEnvConfig(dir);

const config = {
    db_url : process.env.DB_URL!,
    db_key : process.env.DB_KEY!
}

export default {
  schema: './src/lib/db/schema.ts',
  out: './migrations',
  driver: 'turso',
  dbCredentials: {
    url: config.db_url,
    authToken: config.db_key,
  },
} satisfies Config;