// Row types. Not written yet: this file only describes what goes here.
// One TypeScript interface per table, so db.query results have autocomplete and a misspelled
// column name is an error instead of a silent `undefined`.
//
// To write here, for each table in database/schema.sql that a page reads:
// - an interface named after the table (Ticket, Booking, Flight, ...) that extends RowDataPacket
//   (import type { RowDataPacket } from "mysql2"), with one field per column.
//
// Then, in a page:
//
//   const [tickets] = await db.query<Ticket[]>("SELECT * FROM ticket WHERE booking_id = ?", [bookingId]);
//
// Field types, matching how db.ts returns values:
// - INT, DECIMAL                       -> number   (a price comes back as 653, not "653.00")
// - VARCHAR, DATE, DATETIME, TIMESTAMP -> string   (times are UTC text: "2026-12-15 13:00:00")
// - BOOLEAN                            -> 0 | 1    (never true or false)
// - a column that allows NULL          -> add `| null` (for example ticket.seat_number,
//                                         which is NULL once a cancelled booking gives up its seat)
//
// A query that joins tables or picks only some columns gets its own interface
// (for example TicketWithPassenger) instead of reusing a table's interface.
// Keep this file in step with schema.sql: a column change there means a change here.
