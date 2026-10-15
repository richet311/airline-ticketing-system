// Transaction helper. Not written yet: this file only describes what goes here.
// Used by actions that change several tables together, where either everything saves or nothing does:
// book/checkout (purchase), book/seats (hold a seat), my-trips cancel and change,
// employee/admin/flights/new (schedule a flight), and the agent's booking actions.
//
// Start the file with: import "server-only";
//
// To write here:
// - withTransaction(work): `work` is a function that receives one connection and runs its
//   queries on it. withTransaction does everything else, in this order:
//   1. take one connection with db.getConnection()
//   2. conn.beginTransaction()
//   3. run work(conn) and keep what it returns
//   4. conn.commit() if work finished, or conn.rollback() and throw the error again if it failed
//   5. conn.release() in every case (in a finally block)
//
// How an action would use it:
//
//   await withTransaction(async (conn) => {
//     await conn.query("INSERT INTO booking (...) VALUES (?, ...)", [...]);
//     await conn.query("UPDATE seat SET seat_status_id = ? WHERE ...", [...]);
//   });
//
// Why it matters:
// - db.ts keeps at most 10 connections (mysql2's default). Every action that forgets release()
//   keeps one forever. After 10, every page waits for a free connection and the site looks
//   frozen, with no error message.
// - Inside work, use conn.query, never db.query: db.query runs outside the transaction.
