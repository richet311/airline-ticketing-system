import "server-only";

import mysql, { type Pool } from "mysql2/promise";

// Connection to the local MySQL database. Settings come from .env.local (copy .env.example).
// Import it in any page to read data:
//
//   import { db } from "@/lib/db";
//   const [airports] = await db.query("SELECT * FROM airport WHERE country = ?", ["US"]);

const globalForDb = globalThis as typeof globalThis & { db?: Pool };

export const db: Pool =
  globalForDb.db ??
  mysql.createPool({
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

// `pnpm dev` reloads files as you edit them. Reuse one pool instead of opening new connections.
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
