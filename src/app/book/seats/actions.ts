"use server";

import { redirect } from "next/navigation";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";
import { LOGIN_REQUIRED } from "@/lib/loginRedirect";
import { getCurrentUser } from "@/lib/session";

// keep in sync with the countdown in SeatSelector
const HOLD_MINUTES = 10;

// once seats are chosen, they stay HELD this long while the customer checks out (keep in sync with CheckoutForm)
const CHECKOUT_HOLD_MINUTES = 15;

const AVAILABLE = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'AVAILABLE')";
const HELD = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'HELD')";
const BOOKED = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'BOOKED')";

export type SeatActionResult = { ok: true } | { ok: false; error: string };

// TODO: switch to withTransaction() from src/lib/transaction.ts
async function inTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    // always give the connection back to the pool
    conn.release();
  }
}

// Expired holds go back to AVAILABLE, and their tickets give up the seat.
async function releaseExpiredHolds(conn: PoolConnection, flightId: number) {
  await conn.query(
    `UPDATE ticket t
       JOIN seat s ON s.flight_id = t.flight_id AND s.seat_number = t.seat_number
        SET t.seat_number = NULL, t.last_updated = NOW()
      WHERE s.flight_id = ? AND s.seat_status_id = ${HELD} AND s.held_until <= NOW()`,
    [flightId],
  );
  await conn.query(
    `UPDATE seat SET seat_status_id = ${AVAILABLE}, held_until = NULL, last_updated = NOW()
      WHERE flight_id = ? AND seat_status_id = ${HELD} AND held_until <= NOW()`,
    [flightId],
  );
  // seats left BOOKED with no ticket by the old checkout flow (chosen but never paid for) go back on sale
  await conn.query(
    `UPDATE seat s SET s.seat_status_id = ${AVAILABLE}, s.held_until = NULL, s.last_updated = NOW()
      WHERE s.flight_id = ? AND s.seat_status_id = ${BOOKED}
        AND s.last_updated < NOW() - INTERVAL ${CHECKOUT_HOLD_MINUTES} MINUTE
        AND NOT EXISTS (SELECT 1 FROM ticket t WHERE t.flight_id = s.flight_id AND t.seat_number = s.seat_number)`,
    [flightId],
  );
}

async function extendHolds(conn: PoolConnection, flightId: number, seatNumbers: string[]) {
  if (seatNumbers.length === 0) return;
  await conn.query(
    `UPDATE seat SET held_until = NOW() + INTERVAL ${HOLD_MINUTES} MINUTE, last_updated = NOW()
      WHERE flight_id = ? AND seat_number IN (?) AND seat_status_id = ${HELD}`,
    [flightId, seatNumbers],
  );
}

// seats_available = number of AVAILABLE seats in that cabin
async function recountSeats(conn: PoolConnection, flightId: number) {
  await conn.query(
    `UPDATE fare_class fc
        SET fc.seats_available = (SELECT COUNT(*) FROM seat s
                                   WHERE s.flight_id = fc.flight_id
                                     AND s.cabin_class_id = fc.cabin_class_id
                                     AND s.seat_status_id = ${AVAILABLE}),
            fc.last_updated = NOW()
      WHERE fc.flight_id = ?`,
    [flightId],
  );
}

// AVAILABLE -> HELD for 10 minutes
export async function holdSeat(input: {
  flightId: number;
  fareClassId: number;
  seatNumber: string;
  keepSeats: string[];
}): Promise<SeatActionResult> {
  if (!(await getCurrentUser())) return { ok: false, error: LOGIN_REQUIRED };
  const held = await inTransaction(async (conn) => {
    await releaseExpiredHolds(conn, input.flightId);

    // one UPDATE so two people can't hold the same seat (affectedRows is 0 if someone got it first)
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE seat
          SET seat_status_id = ${HELD}, held_until = NOW() + INTERVAL ${HOLD_MINUTES} MINUTE, last_updated = NOW()
        WHERE flight_id = ? AND seat_number = ? AND seat_status_id = ${AVAILABLE}
          AND cabin_class_id = (SELECT cabin_class_id FROM fare_class WHERE fare_class_id = ? AND flight_id = ?)`,
      [input.flightId, input.seatNumber, input.fareClassId, input.flightId],
    );

    await extendHolds(conn, input.flightId, input.keepSeats);
    await recountSeats(conn, input.flightId);
    return result.affectedRows === 1;
  });

  return held ? { ok: true } : { ok: false, error: `Seat ${input.seatNumber} was just taken. Please choose another seat.` };
}

// HELD -> AVAILABLE
export async function releaseSeats(input: {
  flightId: number;
  seatNumbers: string[];
  keepSeats: string[];
}): Promise<SeatActionResult> {
  await inTransaction(async (conn) => {
    await releaseExpiredHolds(conn, input.flightId);
    if (input.seatNumbers.length > 0) {
      await conn.query(
        `UPDATE seat SET seat_status_id = ${AVAILABLE}, held_until = NULL, last_updated = NOW()
          WHERE flight_id = ? AND seat_number IN (?) AND seat_status_id = ${HELD}`,
        [input.flightId, input.seatNumbers],
      );
    }
    await extendHolds(conn, input.flightId, input.keepSeats);
    await recountSeats(conn, input.flightId);
  });
  return { ok: true };
}

// Keeps the chosen seats HELD for checkout, then goes on to the return flight's seats or checkout.
// Checkout turns them BOOKED when it's paid. If the customer leaves, the hold runs out and they go back on sale.
export async function confirmSeats(input: {
  outbound: number;
  returnFare: number | null;
  passengers: number;
  leg: "outbound" | "return";
  outboundSeats: string[];
  seats: string[];
}): Promise<SeatActionResult> {
  if (!(await getCurrentUser())) return { ok: false, error: LOGIN_REQUIRED };
  if (input.seats.length !== input.passengers) {
    return { ok: false, error: "Choose a seat for every passenger first." };
  }

  const fareClassId = input.leg === "return" && input.returnFare !== null ? input.returnFare : input.outbound;
  const [fares] = await db.query<RowDataPacket[]>("SELECT flight_id FROM fare_class WHERE fare_class_id = ?", [
    fareClassId,
  ]);
  if (fares.length === 0) {
    return { ok: false, error: "That fare no longer exists. Please search again." };
  }
  const flightId: number = fares[0].flight_id;

  const booked = await inTransaction(async (conn) => {
    await releaseExpiredHolds(conn, flightId);
    // a hold ran out, undo everything
    if (!(await extendForCheckout(conn, flightId, input.seats))) throw new HoldExpiredError();

    // the outbound seats get the same checkout time once the return seats are chosen
    if (input.leg === "return" && input.outboundSeats.length > 0) {
      const [outboundFares] = await conn.query<RowDataPacket[]>("SELECT flight_id FROM fare_class WHERE fare_class_id = ?", [
        input.outbound,
      ]);
      if (outboundFares.length === 0 || !(await extendForCheckout(conn, outboundFares[0].flight_id, input.outboundSeats))) {
        throw new HoldExpiredError();
      }
    }
    await recountSeats(conn, flightId);
    return true;
  }).catch((error) => {
    if (error instanceof HoldExpiredError) return false;
    throw error;
  });

  if (!booked) {
    return { ok: false, error: "Your seat hold ran out. Please choose your seats again." };
  }

  const params = new URLSearchParams({ outbound: String(input.outbound), passengers: String(input.passengers) });
  if (input.returnFare !== null) {
    params.set("return", String(input.returnFare));
  }
  if (input.leg === "outbound" && input.returnFare !== null) {
    params.set("leg", "return");
    params.set("outbound_seats", input.seats.join(","));
    redirect(`/book/seats?${params}`);
  }
  params.set("outbound_seats", (input.leg === "outbound" ? input.seats : input.outboundSeats).join(","));
  if (input.leg === "return") {
    params.set("return_seats", input.seats.join(","));
  }
  redirect(`/book/checkout?${params}`);
}

class HoldExpiredError extends Error {}

// True when every seat is still HELD (not expired), after giving them CHECKOUT_HOLD_MINUTES more
async function extendForCheckout(conn: PoolConnection, flightId: number, seatNumbers: string[]): Promise<boolean> {
  const [held] = await conn.query<RowDataPacket[]>(
    `SELECT seat_number FROM seat
      WHERE flight_id = ? AND seat_number IN (?) AND seat_status_id = ${HELD} AND held_until > NOW()
        FOR UPDATE`,
    [flightId, seatNumbers],
  );
  if (held.length !== new Set(seatNumbers).size) return false;

  await conn.query(
    `UPDATE seat SET held_until = NOW() + INTERVAL ${CHECKOUT_HOLD_MINUTES} MINUTE, last_updated = NOW()
      WHERE flight_id = ? AND seat_number IN (?) AND seat_status_id = ${HELD}`,
    [flightId, seatNumbers],
  );
  return true;
}
