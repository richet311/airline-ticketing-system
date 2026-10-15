import "server-only";

import mysql, { type Pool } from "mysql2/promise";

// Connection to the local MySQL database. Settings come from .env.local (copy .env.example).
// Import it in any page to read data:
//
//   import { db } from "@/lib/db";
//   const [airports] = await db.query("SELECT * FROM airport WHERE country = ?", ["US"]);

// Pool is mysql2's type for a shared set of connections. globalForDb is globalThis, an object
// that survives `pnpm dev` reloads, described to TypeScript as having one optional extra
// field, db, where the pool is kept (see the last line of this file).
const globalForDb = globalThis as typeof globalThis & { db?: Pool };

function createPool(): Pool {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // DECIMAL columns (prices, fees, totals) come back as numbers, e.g. 189 instead of "189.00".
    decimalNumbers: true,
    // DATE, DATETIME and TIMESTAMP columns come back exactly as stored, as text like
    // "2026-11-14 06:05:00", instead of Date objects shifted to this computer's time zone.
    dateStrings: true,
  });

  // Every time in the database is UTC (team rule 6 in schema.sql). Each new connection
  // switches its MySQL session to UTC before it runs anything else, so NOW() is UTC and
  // TIMESTAMP columns (held_until, created_at, ...) come back in UTC like the flight times.
  pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });

  return pool;
}

export const db: Pool = globalForDb.db ?? createPool();

// `pnpm dev` reloads files as you edit them. Reuse one pool instead of opening new connections.
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
