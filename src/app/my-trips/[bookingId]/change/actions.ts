"use server";

import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";

import { legChangeProblem, roundCents } from "@/lib/bookingRules";
import { getCurrentUser } from "@/lib/session";
import { withTransaction } from "@/lib/transaction";
import { addPayment, AVAILABLE, BOOKED, findReplacementFlights, getTrip, lockBooking, recountSeats } from "@/lib/trips";
import type { TripActionState } from "@/lib/types";

// guests are saved as the system user for now
const SYSTEM_USER_ID = 1;

class Refused extends Error {}

// Moves every ticket on one of the booking's flights to another flight on the same route, in the same cabin.
// The old seats go back to AVAILABLE, new seats are picked next to each other, and the fare difference
// plus the cabin's change fee is charged (or refunded when the new flight is cheaper).
export async function changeFlight(previousState: TripActionState, formData: FormData): Promise<TripActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim().toUpperCase();
  const oldFlightId = Number(formData.get("flight_id"));
  const newFlightId = Number(formData.get("new_flight_id"));
  const userId = (await getCurrentUser())?.user_id ?? SYSTEM_USER_ID;

  try {
    await withTransaction(async (conn) => {
      await lockBooking(conn, bookingId);
      const trip = await getTrip(bookingId, conn);
      if (!trip) throw new Refused("We couldn't find this trip.");
      if (trip.booking.booking_status_name !== "CONFIRMED") throw new Refused("Only confirmed trips can be changed online.");

      const leg = trip.legs.find((l) => l.flight.flight_id === oldFlightId);
      if (!leg) throw new Refused("That flight isn't on this trip.");
      const problem = legChangeProblem(leg.tickets);
      if (problem) throw new Refused(problem);

      // prices are worked out again here, not taken from the form
      const options = await findReplacementFlights(trip, leg, conn);
      const choice = options.find((option) => option.flight.flight_id === newFlightId);
      if (!choice) throw new Refused("That flight can't be booked anymore. Please choose another.");

      // FOR UPDATE so two changes can't take the same seats. Lowest rows first keeps travelers together.
      const newSeats = new Map<string, string>();
      for (const cabinId of new Set(leg.tickets.map((ticket) => ticket.cabin_class_id))) {
        const cabinTickets = leg.tickets.filter((ticket) => ticket.cabin_class_id === cabinId);
        const [seats] = await conn.query<RowDataPacket[]>(
          `SELECT seat_number FROM seat
            WHERE flight_id = ? AND cabin_class_id = ? AND seat_status_id = ${AVAILABLE}
            ORDER BY CAST(seat_number AS UNSIGNED), seat_number
            LIMIT ?
              FOR UPDATE`,
          [newFlightId, cabinId, cabinTickets.length],
        );
        if (seats.length < cabinTickets.length) {
          throw new Refused(`${choice.flight.flight_number} just sold out. Please choose another flight.`);
        }
        cabinTickets.forEach((ticket, i) => newSeats.set(ticket.e_ticket_number, seats[i].seat_number));
      }

      await conn.query(
        `UPDATE seat SET seat_status_id = ${BOOKED}, held_until = NULL, updated_by = ?, last_updated = NOW()
          WHERE flight_id = ? AND seat_number IN (?)`,
        [userId, newFlightId, [...newSeats.values()]],
      );
      const oldSeats = leg.tickets.flatMap((ticket) => (ticket.seat_number === null ? [] : [ticket.seat_number]));
      if (oldSeats.length > 0) {
        await conn.query(
          `UPDATE seat SET seat_status_id = ${AVAILABLE}, held_until = NULL, updated_by = ?, last_updated = NOW()
            WHERE flight_id = ? AND seat_number IN (?)`,
          [userId, oldFlightId, oldSeats],
        );
      }

      // bags stay on the ticket, so they move with it
      for (const ticket of leg.tickets) {
        const fare = choice.fares.get(ticket.e_ticket_number)!;
        await conn.query(
          `UPDATE ticket
              SET flight_id = ?, fare_class_id = ?, seat_number = ?, flight_fare = ?, checked_in = 0,
                  updated_by = ?, last_updated = NOW()
            WHERE e_ticket_number = ?`,
          [newFlightId, fare.fare_class_id, newSeats.get(ticket.e_ticket_number), fare.base_price, userId, ticket.e_ticket_number],
        );
      }

      await conn.query("UPDATE booking SET total_amount = ?, updated_by = ?, last_updated = NOW() WHERE booking_id = ?", [
        roundCents(trip.booking.total_amount + choice.cost),
        userId,
        bookingId,
      ]);
      if (choice.cost > 0) await addPayment(conn, bookingId, "RECEIVED", choice.cost, userId);
      if (choice.cost < 0) await addPayment(conn, bookingId, "REFUNDED", -choice.cost, userId);

      await recountSeats(conn, oldFlightId);
      await recountSeats(conn, newFlightId);
    });
  } catch (error) {
    if (error instanceof Refused) return { error: error.message };
    throw error;
  }

  redirect(`/my-trips/${bookingId}?done=changed`);
}
