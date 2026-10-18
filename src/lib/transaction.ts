import "server-only";

import type { PoolConnection } from "mysql2/promise";

import { db } from "@/lib/db";

// Runs work() in one transaction: commit if it succeeds, rollback if it throws.
// Use conn.query inside work, not db.query.

export async function withTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    // keep the original error if the rollback fails too
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    // always release, or the pool runs out of connections
    conn.release();
  }
}
