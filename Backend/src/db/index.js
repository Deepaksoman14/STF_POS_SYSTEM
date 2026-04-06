import pg from "pg";
import env from "../config/env.js";

const { Pool } = pg;
const useSsl = env.DB_SSL || env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export async function query(text, params = []) {
  return pool.query(text, params);
}
