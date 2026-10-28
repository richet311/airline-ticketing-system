import "server-only";

import { randomUUID } from "node:crypto";
import type { Connection } from "mysql2/promise";

import {
  BOARDING_STARTS_MINUTES,
  cabinChangeCost,
  CHANGEABLE_FLIGHT_STATUSES,
  CUSTOMER_CUTOFF_MINUTES,
  roundCents,
} from "@/lib/bookingRules";
import { db } from "@/lib/db";
import type {
  Payment,
  ReplacementFareRow,
  ReplacementFlightRow,
  TripBookingRow,
  TripTicketRow,
  UpgradeType,
} from "@/lib/types";

// Loads one booking for My Trips and Check In, and the writes their actions share.
// Pass the transaction's conn inside withTransaction, otherwise the pool is used.

export const AVAILABLE = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'AVAILABLE')";
export const BOOKED = "(SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'BOOKED')";

// one flight on the booking and every ticket on it
export type TripLeg = { flight: TripTicketRow; tickets: TripTicketRow[] };

export type Trip = {
  booking: TripBookingRow;
  legs: TripLeg[];
  payments: Payment[];
  upgrades: UpgradeType[];
};

export async function getTrip(bookingId: string, conn: Connection = db): Promise<Trip | null> {
  const [bookings] = await conn.query<TripBookingRow[]>(
    `SELECT b.booking_id, bs.booking_status_name, b.total_amount, b.currency, b.created_at,
            p.first_name AS booker_first_name, p.last_name AS booker_last_name,
            (SELECT COALESCE(SUM(CASE pay.payment_status WHEN 'RECEIVED' THEN pay.total_amount
                                                         WHEN 'REFUNDED' THEN -pay.total_amount ELSE 0 END), 0)
               FROM payment pay WHERE pay.booking_id = b.booking_id) AS paid_amount
       FROM booking b
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN passenger p       ON p.passenger_id = b.passenger_id
      WHERE b.booking_id = ?`,
    [bookingId],
  );
  if (bookings.length === 0) return null;

  const [tickets] = await conn.query<TripTicketRow[]>(
    `SELECT t.e_ticket_number, t.passenger_id, p.first_name, p.last_name,
            p.passport_number, p.passport_expiry_date, p.nationality,
            t.seat_number, t.flight_fare, t.checked_in, t.boarded,
            f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) AS duration_min,
            TIMESTAMPDIFF(MINUTE, NOW(), f.departure_time) AS minutes_to_departure,
            DATE_FORMAT(f.departure_time - INTERVAL ${BOARDING_STARTS_MINUTES} MINUTE, '%Y-%m-%d %H:%i:%s') AS boarding_time,
            o.airport_id AS origin_airport_id, o.airport_code AS origin, o.city AS origin_city,
            o.timezone AS origin_timezone,
            d.airport_id AS destination_airport_id, d.airport_code AS destination, d.city AS destination_city,
            d.timezone AS destination_timezone,
            fs.flight_status_name, CONCAT(tm.terminal_name, ' · ', g.gate_number) AS departure_gate,
            fc.fare_class_id, fc.cabin_class_id, cc.cabin_class_name, fc.change_fee,
            COALESCE(bg.bag_count, 0) AS bag_count, COALESCE(bg.bag_fees, 0) AS bag_fees
       FROM ticket t
       JOIN passenger p      ON p.passenger_id = t.passenger_id
       JOIN flight f         ON f.flight_id = t.flight_id
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       JOIN fare_class fc    ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc   ON cc.cabin_class_id = fc.cabin_class_id
       LEFT JOIN gate g      ON g.gate_id = f.departure_gate_id
       LEFT JOIN terminal tm ON tm.terminal_id = g.terminal_id
       LEFT JOIN (SELECT e_ticket_number, COUNT(*) AS bag_count, SUM(fee) AS bag_fees
                    FROM baggage GROUP BY e_ticket_number) bg ON bg.e_ticket_number = t.e_ticket_number
      WHERE t.booking_id = ?
      ORDER BY f.departure_time, t.e_ticket_number`,
    [bookingId],
  );

  const [payments] = await conn.query<Payment[]>(
    "SELECT * FROM payment WHERE booking_id = ? ORDER BY payment_id",
    [bookingId],
  );

  const [upgrades] = await conn.query<UpgradeType[]>(
    `SELECT ut.upgrade_id, ut.upgrade_name, ut.upgrade_description, ut.upgrade_price
       FROM booking_upgrade bu
       JOIN upgrade_type ut ON ut.upgrade_id = bu.upgrade_id
      WHERE bu.booking_id = ?
      ORDER BY ut.upgrade_name`,
    [bookingId],
  );

  const legs: TripLeg[] = [];
  for (const ticket of tickets) {
    const leg = legs.find((l) => l.flight.flight_id === ticket.flight_id);
    if (leg) leg.tickets.push(ticket);
    else legs.push({ flight: ticket, tickets: [ticket] });
  }

  return { booking: bookings[0], legs, payments, upgrades };
}

// Locks the booking row so two changes to it can't run at once. Call first inside withTransaction.
export async function lockBooking(conn: Connection, bookingId: string): Promise<void> {
  await conn.query("SELECT booking_id FROM booking WHERE booking_id = ? FOR UPDATE", [bookingId]);
}

// "Depart" / "Return" for a round trip, otherwise "Flight 1", "Flight 2"
export function legLabel(legs: TripLeg[], index: number): string {
  if (legs.length === 1) return "Flight";
  const [first, second] = legs;
  const roundTrip =
    legs.length === 2 &&
    second.flight.origin === first.flight.destination &&
    second.flight.destination === first.flight.origin;
  if (roundTrip) return index === 0 ? "Depart" : "Return";
  return `Flight ${index + 1}`;
}

// A flight the leg's travelers could move to, with each ticket's new fare and what the move costs
export type ReplacementFlight = {
  flight: ReplacementFlightRow;
  fares: Map<string, ReplacementFareRow>; // e-ticket -> its fare on the new flight
  cost: number; // positive is charged, negative is refunded
  feeWaived: boolean;
};

// Other flights on the same route that still sell every cabin the travelers are in, with enough seats.
// They have to fit between the trip's other flights (a new outbound can't land after the return leaves).
export async function findReplacementFlights(trip: Trip, leg: TripLeg, conn: Connection = db): Promise<ReplacementFlight[]> {
  const index = trip.legs.indexOf(leg);
  const leaveAfter = index > 0 ? trip.legs[index - 1].flight.arrival_time : null;
  const arriveBefore = index < trip.legs.length - 1 ? trip.legs[index + 1].flight.departure_time : null;

  const [flights] = await conn.query<ReplacementFlightRow[]>(
    `SELECT f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
            TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) AS duration_min, fs.flight_status_name
       FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      WHERE f.origin_airport_id = ? AND f.destination_airport_id = ? AND f.flight_id <> ?
        AND fs.flight_status_name IN (?)
        AND f.departure_time > NOW() + INTERVAL ${CUSTOMER_CUTOFF_MINUTES} MINUTE
        AND (? IS NULL OR f.departure_time > ?)
        AND (? IS NULL OR f.arrival_time < ?)
      ORDER BY f.departure_time
      LIMIT 20`,
    [
      leg.flight.origin_airport_id,
      leg.flight.destination_airport_id,
      leg.flight.flight_id,
      CHANGEABLE_FLIGHT_STATUSES,
      leaveAfter,
      leaveAfter,
      arriveBefore,
      arriveBefore,
    ],
  );
  if (flights.length === 0) return [];

  const [fares] = await conn.query<ReplacementFareRow[]>(
    `SELECT fc.fare_class_id, fc.flight_id, fc.cabin_class_id, fc.base_price,
            (SELECT COUNT(*) FROM seat s
              WHERE s.flight_id = fc.flight_id AND s.cabin_class_id = fc.cabin_class_id
                AND s.seat_status_id = ${AVAILABLE}) AS open_seats
       FROM fare_class fc
      WHERE fc.flight_id IN (?)`,
    [flights.map((flight) => flight.flight_id)],
  );

  // no change fee when we cancelled their flight
  const feeWaived = leg.flight.flight_status_name === "CANCELLED";
  const seatsNeeded = new Map<number, number>();
  for (const ticket of leg.tickets) {
    seatsNeeded.set(ticket.cabin_class_id, (seatsNeeded.get(ticket.cabin_class_id) ?? 0) + 1);
  }

  const options: ReplacementFlight[] = [];
  for (const flight of flights) {
    const flightFares = fares.filter((fare) => fare.flight_id === flight.flight_id);
    const fits = [...seatsNeeded].every(([cabinId, needed]) =>
      flightFares.some((fare) => fare.cabin_class_id === cabinId && fare.open_seats >= needed),
    );
    if (!fits) continue;

    const ticketFares = new Map<string, ReplacementFareRow>();
    let cost = 0;
    for (const ticket of leg.tickets) {
      const fare = flightFares.find((f) => f.cabin_class_id === ticket.cabin_class_id)!;
      ticketFares.set(ticket.e_ticket_number, fare);
      cost += cabinChangeCost(ticket.flight_fare, fare.base_price, feeWaived ? 0 : ticket.change_fee);
    }
    options.push({ flight, fares: ticketFares, cost: roundCents(cost), feeWaived });
  }
  return options;
}

// Adds a RECEIVED or REFUNDED payment row, paid the same way as the booking's last payment
export async function addPayment(
  conn: Connection,
  bookingId: string,
  status: "RECEIVED" | "REFUNDED",
  amount: number,
  userId: number,
) {
  await conn.query(
    `INSERT INTO payment (booking_id, payment_status, total_amount, payment_method, idempotency_key, payment_time,
                          created_by, created_at, updated_by, last_updated)
     VALUES (?, ?, ?, COALESCE((SELECT method FROM (SELECT payment_method AS method FROM payment WHERE booking_id = ?
                                                     ORDER BY payment_id DESC LIMIT 1) AS last_payment), 'CREDIT'),
             ?, NOW(), ?, NOW(), ?, NOW())`,
    [bookingId, status, amount, bookingId, randomUUID(), userId, userId],
  );
}

// seats_available = number of AVAILABLE seats in that cabin
export async function recountSeats(conn: Connection, flightId: number) {
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
