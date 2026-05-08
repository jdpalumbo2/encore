import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  // Don't throw at module-init time; some build phases load this without env.
  // Routes that need the DB should check `db` themselves or the connection
  // will throw on first use, which is the desired loud failure.
  console.warn("[db] DATABASE_URL not set. DB calls will fail at runtime.");
}

// Singleton across hot reloads + warm Vercel function instances.
const globalForDb = globalThis as unknown as {
  __encoreSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__encoreSql ??
  postgres(url ?? "postgresql://invalid", {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__encoreSql = sql;
}

export const db = drizzle(sql, { schema });
export { schema };
