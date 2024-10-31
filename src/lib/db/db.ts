import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "./schema"

const client = createClient({
  url: process.env.DB_URL!,
  authToken: process.env.DB_KEY!,
  
});

export const dbClient = drizzle(client, { schema: schema});
