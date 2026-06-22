import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export async function query<T = any>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}
