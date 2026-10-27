import "server-only";

import mysql, { type Pool } from "mysql2/promise";

// MySQL connection pool. Settings come from .env.local.

const globalForDb = globalThis as typeof globalThis & { db?: Pool };

const SQL_MODE =
  "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION";

function createPool(): Pool {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // hosted databases only accept encrypted connections. DB_SSL_CA is the host's CA certificate
    // (Aiven gives you one) on a single line, with \n between its lines
    ssl:
      process.env.DB_SSL === "true"
        ? { ca: process.env.DB_SSL_CA?.replace(/\\n/g, "\n"), rejectUnauthorized: true }
        : undefined,
    // DECIMAL as numbers instead of strings
    decimalNumbers: true,
    // dates as strings, not Date objects
    dateStrings: true,
  });

  // run every connection in UTC, with MySQL's usual SQL mode (Aiven defaults to a stricter ANSI mode)
  pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
    connection.query(`SET sql_mode = '${SQL_MODE}'`);
  });

  return pool;
}

export const db: Pool = globalForDb.db ?? createPool();

// reuse the pool across dev reloads
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
