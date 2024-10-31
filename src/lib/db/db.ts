import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "./schema"

const client = createClient({
  url: process.env.DB_URL!,
  authToken: process.env.DB_KEY!,
  fetch: (url: string, options: any) => {
    return fetch(url, {
      ...options,
      timeout: 30000, 
    });
  },
});

export const dbClient = drizzle(client, { schema: schema});
