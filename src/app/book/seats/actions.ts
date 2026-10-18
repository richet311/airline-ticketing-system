"use server";

// TODO: check who is signed in before changing seats

import { redirect } from "next/navigation";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";

// keep in sync with the countdown in SeatSelector
const HOLD_MINUTES = 10;

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

// HELD -> BOOKED, then on to the return flight's seats or checkout.
// TODO: seats stay BOOKED with no ticket if the user leaves before paying
export async function confirmSeats(input: {
  outbound: number;
  returnFare: number | null;
  passengers: number;
  leg: "outbound" | "return";
  outboundSeats: string[];
  seats: string[];
}): Promise<SeatActionResult> {
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
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE seat SET seat_status_id = ${BOOKED}, held_until = NULL, last_updated = NOW()
        WHERE flight_id = ? AND seat_number IN (?) AND seat_status_id = ${HELD}`,
      [flightId, input.seats],
    );
    // a hold ran out, undo everything
    if (result.affectedRows !== input.seats.length) {
      throw new HoldExpiredError();
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
