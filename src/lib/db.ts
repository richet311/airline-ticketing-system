import "server-only";

import mysql, { type Pool } from "mysql2/promise";

// MySQL connection pool. Settings come from .env.local.

const globalForDb = globalThis as typeof globalThis & { db?: Pool };

function createPool(): Pool {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // DECIMAL as numbers instead of strings
    decimalNumbers: true,
    // dates as strings, not Date objects
    dateStrings: true,
  });

  // run every connection in UTC
  pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });

  return pool;
}

export const db: Pool = globalForDb.db ?? createPool();

// reuse the pool across dev reloads
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
