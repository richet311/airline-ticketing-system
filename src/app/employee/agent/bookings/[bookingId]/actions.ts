"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { getSignedInStaff } from "@/app/employee/admin/requireAdmin";
import {
  BAG_FLIGHT_STATUSES,
  bagFeeAt,
  bagWeightProblem,
  cabinChangeCost,
  CHANGEABLE_FLIGHT_STATUSES,
  cancellationRefund,
  roundCents,
  statusChangeProblem,
} from "@/lib/bookingRules";
import { CUSTOMER_SERVICE_AGENT } from "@/lib/roles";
import { withTransaction } from "@/lib/transaction";

//The Booking tile is for customer service agents and system administrators to adjust certain aspects of a traveler's booking
//Monetary calculations are done here, adding into account change fees

export type BookingChange = {
  bookingId: string;
  status: string | null;
  tickets: { eTicket: string; fareClassId: number; seatNumber: string }[];
  bags: { eTicket: string; weights: number[] }[];
};

export type ConfirmResult = { ok: true } | { ok: false; error: string };

const AVAILABLE = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'AVAILABLE')";
const HELD = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'HELD')";
const BOOKED = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'BOOKED')";

class Refused extends Error {}

export async function confirmBookingChanges(changes: BookingChange[]): Promise<ConfirmResult> {
  const employee = await getSignedInStaff([CUSTOMER_SERVICE_AGENT]);
  if (!employee) return { ok: false, error: "Only Customer Service Agents and System Administrators can change bookings." };
  if (changes.length === 0) return { ok: false, error: "There are no changes to confirm." };

  try {
    await withTransaction(async (conn) => {
      const flightsTouched = new Set<number>();
      for (const change of changes) {
        try {
          await applyBookingChange(conn, change, employee.user_id, flightsTouched);
        } catch (error) {
          if (error instanceof Refused) throw new Refused(`${change.bookingId}: ${error.message}`);
          throw error;
        }
      }
      for (const flightId of flightsTouched) await recountSeats(conn, flightId);
    });
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    throw error;
  }

  revalidatePath("/employee/admin");
  revalidatePath("/employee/agent");
  return { ok: true };
}

async function applyBookingChange(conn: PoolConnection, change: BookingChange, userId: number, flightsTouched: Set<number>) {
  const [bookings] = await conn.query<RowDataPacket[]>(
    `SELECT b.total_amount, bs.booking_status_name,
            (SELECT COALESCE(SUM(CASE p.payment_status WHEN 'RECEIVED' THEN p.total_amount
                                                       WHEN 'REFUNDED' THEN -p.total_amount ELSE 0 END), 0)
               FROM payment p WHERE p.booking_id = b.booking_id) AS paid
       FROM booking b
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
      WHERE b.booking_id = ?
        FOR UPDATE`,
    [change.bookingId],
  );
  if (bookings.length === 0) throw new Refused("this booking no longer exists.");
  const savedStatus: string = bookings[0].booking_status_name;
  const total = Number(bookings[0].total_amount);
  const paid = Number(bookings[0].paid);
  if (savedStatus === "CANCELLED") throw new Refused("this booking is cancelled.");

  const newStatus = change.status ?? savedStatus;
  const problem = statusChangeProblem(savedStatus, newStatus);
  if (problem) throw new Refused(problem);

  const [tickets] = await conn.query<RowDataPacket[]>(
    `SELECT t.e_ticket_number, t.flight_id, t.fare_class_id, t.seat_number, t.flight_fare, fc.change_fee,
            fs.flight_status_name
       FROM ticket t
       JOIN fare_class fc    ON fc.fare_class_id = t.fare_class_id
       JOIN flight f         ON f.flight_id = t.flight_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE t.booking_id = ?
        FOR UPDATE`,
    [change.bookingId],
  );
  for (const ticket of tickets) flightsTouched.add(ticket.flight_id);

  //In the event of cancelling, free the seat(s) and refund everything paid
  if (newStatus === "CANCELLED") {
    const refund = cancellationRefund(paid);
    await conn.query(
      `UPDATE seat s JOIN ticket t ON t.flight_id = s.flight_id AND t.seat_number = s.seat_number
          SET s.seat_status_id = ${AVAILABLE}, s.held_until = NULL, s.updated_by = ?, s.last_updated = NOW()
        WHERE t.booking_id = ?`,
      [userId, change.bookingId],
    );
    await conn.query("UPDATE ticket SET seat_number = NULL, updated_by = ?, last_updated = NOW() WHERE booking_id = ?", [
      userId,
      change.bookingId,
    ]);
    await saveBooking(conn, change.bookingId, "CANCELLED", roundCents(paid - refund), userId);
    if (refund > 0) await addPayment(conn, change.bookingId, "REFUNDED", refund, userId);
    return;
  }

  let difference = 0;
  const ticketById = new Map(tickets.map((ticket) => [ticket.e_ticket_number as string, ticket]));
  const openTicket = (eTicket: string, allowedStatuses = CHANGEABLE_FLIGHT_STATUSES) => {
    const ticket = ticketById.get(eTicket);
    if (!ticket) throw new Refused(`ticket ${eTicket} isn't on this booking.`);
    if (!allowedStatuses.includes(ticket.flight_status_name)) {
      throw new Refused(`ticket ${eTicket}'s flight is ${ticket.flight_status_name.toLowerCase()}, so it can't change.`);
    }
    return ticket;
  };

  for (const move of change.tickets) {
    const ticket = openTicket(move.eTicket);
    if (ticket.seat_number === null) throw new Refused(`ticket ${move.eTicket} has no seat to change.`);

    const [fares] = await conn.query<RowDataPacket[]>(
      "SELECT cabin_class_id, base_price FROM fare_class WHERE fare_class_id = ? AND flight_id = ?",
      [move.fareClassId, ticket.flight_id],
    );
    if (fares.length === 0) throw new Refused(`that fare isn't on ticket ${move.eTicket}'s flight.`);

    if (move.seatNumber !== ticket.seat_number) {
      const [seats] = await conn.query<RowDataPacket[]>(
        `SELECT seat_number FROM seat
          WHERE flight_id = ? AND seat_number = ? AND cabin_class_id = ? AND seat_status_id = ${AVAILABLE}
            FOR UPDATE`,
        [ticket.flight_id, move.seatNumber, fares[0].cabin_class_id],
      );
      if (seats.length === 0) throw new Refused(`seat ${move.seatNumber} was just taken. Choose another.`);

      await conn.query(
        `UPDATE seat new_seat
           JOIN seat old_seat ON old_seat.flight_id = new_seat.flight_id AND old_seat.seat_number = ?
            SET new_seat.seat_status_id = old_seat.seat_status_id, new_seat.held_until = old_seat.held_until,
                new_seat.updated_by = ?, new_seat.last_updated = NOW()
          WHERE new_seat.flight_id = ? AND new_seat.seat_number = ?`,
        [ticket.seat_number, userId, ticket.flight_id, move.seatNumber],
      );
    } else if (move.fareClassId !== ticket.fare_class_id) {
      throw new Refused(`a new cabin needs a new seat (ticket ${move.eTicket}).`);
    }

    await conn.query(
      `UPDATE ticket SET seat_number = ?, fare_class_id = ?, flight_fare = ?, updated_by = ?, last_updated = NOW()
        WHERE e_ticket_number = ?`,
      [move.seatNumber, move.fareClassId, fares[0].base_price, userId, move.eTicket],
    );
    if (move.seatNumber !== ticket.seat_number) {
      await conn.query(
        `UPDATE seat SET seat_status_id = ${AVAILABLE}, held_until = NULL, updated_by = ?, last_updated = NOW()
          WHERE flight_id = ? AND seat_number = ?`,
        [userId, ticket.flight_id, ticket.seat_number],
      );
    }
    //calculating upgrade/downgrade costs
    difference +=
      move.fareClassId !== ticket.fare_class_id
        ? cabinChangeCost(Number(ticket.flight_fare), Number(fares[0].base_price), Number(ticket.change_fee))
        : Number(fares[0].base_price) - Number(ticket.flight_fare);
  }

  //adding more bags to the booking
  for (const added of change.bags) {
    openTicket(added.eTicket, BAG_FLIGHT_STATUSES);
    const [[{ bags }]] = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS bags FROM baggage WHERE e_ticket_number = ?",
      [added.eTicket],
    );
    for (const [i, weight] of added.weights.entries()) {
      const weightProblem = bagWeightProblem(weight);
      if (weightProblem) throw new Refused(weightProblem);
      const fee = bagFeeAt(Number(bags) + i);

      let tag = "";
      for (let n = 1; ; n++) {
        tag = `BG${change.bookingId}${String(n).padStart(2, "0")}`;
        const [taken] = await conn.query<RowDataPacket[]>("SELECT 1 FROM baggage WHERE tag_number = ?", [tag]);
        if (taken.length === 0) break;
      }
      await conn.query(
        `INSERT INTO baggage (tag_number, e_ticket_number, weightage, baggage_status_id, fee,
                              created_by, created_at, updated_by, last_updated)
         VALUES (?, ?, ?, (SELECT baggage_status_id FROM baggage_status WHERE baggage_status_name = 'CHECKED'),
                 ?, ?, NOW(), ?, NOW())`,
        [tag, added.eTicket, weight, fee, userId, userId],
      );
      difference += fee;
    }
  }

  // PENDING to CONFIRMED: the booking's held seats become BOOKED
  if (newStatus === "CONFIRMED" && savedStatus === "PENDING") {
    await conn.query(
      `UPDATE seat s JOIN ticket t ON t.flight_id = s.flight_id AND t.seat_number = s.seat_number
          SET s.seat_status_id = ${BOOKED}, s.held_until = NULL, s.updated_by = ?, s.last_updated = NOW()
        WHERE t.booking_id = ? AND s.seat_status_id = ${HELD}`,
      [userId, change.bookingId],
    );
  }

  difference = roundCents(difference);
  await saveBooking(conn, change.bookingId, newStatus, roundCents(total + difference), userId);
  if (difference > 0) await addPayment(conn, change.bookingId, "RECEIVED", difference, userId);
  if (difference < 0) await addPayment(conn, change.bookingId, "REFUNDED", -difference, userId);
}

async function saveBooking(conn: PoolConnection, bookingId: string, status: string, total: number, userId: number) {
  await conn.query(
    `UPDATE booking
        SET booking_status_id = (SELECT booking_status_id FROM booking_status WHERE booking_status_name = ?),
            total_amount = ?, expires_at = IF(? = 'PENDING', expires_at, NULL), updated_by = ?, last_updated = NOW()
      WHERE booking_id = ?`,
    [status, total, status, userId, bookingId],
  );
}

async function addPayment(conn: PoolConnection, bookingId: string, status: "RECEIVED" | "REFUNDED", amount: number, userId: number) {
  await conn.query(
    `INSERT INTO payment (booking_id, payment_status, total_amount, payment_method, idempotency_key, payment_time,
                          created_by, created_at, updated_by, last_updated)
     VALUES (?, ?, ?, COALESCE((SELECT method FROM (SELECT payment_method AS method FROM payment WHERE booking_id = ?
                                                     ORDER BY payment_id DESC LIMIT 1) AS last_payment), 'CREDIT'),
             ?, NOW(), ?, NOW(), ?, NOW())`,
    [bookingId, status, amount, bookingId, randomUUID(), userId, userId],
  );
}

async function recountSeats(conn: PoolConnection, flightId: number) {
  await conn.query(
    `UPDATE fare_class fc
        SET fc.seats_available = (SELECT COUNT(*) FROM seat s
                                   WHERE s.flight_id = fc.flight_id AND s.cabin_class_id = fc.cabin_class_id
                                     AND s.seat_status_id = ${AVAILABLE}),
            fc.last_updated = NOW()
      WHERE fc.flight_id = ?`,
    [flightId],
  );
}
