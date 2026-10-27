"use server";

import { refresh } from "next/cache";

import { checkInProblem, documentProblem } from "@/lib/bookingRules";
import { getCurrentUser } from "@/lib/session";
import { withTransaction } from "@/lib/transaction";
import { getTrip, lockBooking } from "@/lib/trips";
import type { TripActionState } from "@/lib/types";

// guests are saved as the system user for now
const SYSTEM_USER_ID = 1;

class Refused extends Error {}

// Checks in the chosen travelers on one flight (ticket.checked_in = 1).
// Each needs a seat and a passport that is valid on the day, and check-in has to be open.
export async function checkIn(previousState: TripActionState, formData: FormData): Promise<TripActionState> {
  const bookingId = String(formData.get("booking_id") ?? "").trim().toUpperCase();
  const flightId = Number(formData.get("flight_id"));
  const chosen = formData.getAll("e_ticket_number").map(String);
  if (chosen.length === 0) return { error: "Choose at least one traveler to check in." };
  const userId = (await getCurrentUser())?.user_id ?? SYSTEM_USER_ID;

  try {
    await withTransaction(async (conn) => {
      await lockBooking(conn, bookingId);
      const trip = await getTrip(bookingId, conn);
      if (!trip) throw new Refused("We couldn't find this trip.");
      if (trip.booking.booking_status_name !== "CONFIRMED") throw new Refused("Only confirmed trips can be checked in.");

      const leg = trip.legs.find((l) => l.flight.flight_id === flightId);
      if (!leg) throw new Refused("That flight isn't on this trip.");
      const closed = checkInProblem(leg.flight);
      if (closed) throw new Refused(closed);

      const toCheckIn: string[] = [];
      for (const eTicket of chosen) {
        const ticket = leg.tickets.find((t) => t.e_ticket_number === eTicket);
        if (!ticket) throw new Refused(`Ticket ${eTicket} isn't on this flight.`);
        if (ticket.checked_in === 1) continue;
        const who = `${ticket.first_name ?? ""} ${ticket.last_name ?? ""}`.trim();
        if (ticket.seat_number === null) throw new Refused(`${who} has no seat. Please see an agent at the airport.`);
        const documents = documentProblem(ticket);
        if (documents) throw new Refused(`${who}: ${documents}`);
        toCheckIn.push(eTicket);
      }

      if (toCheckIn.length > 0) {
        await conn.query(
          `UPDATE ticket
              SET checked_in = 1, updated_by = ?, last_updated = NOW()
            WHERE e_ticket_number IN (?)`,
          [userId, toCheckIn],
        );
      }
    });
  } catch (error) {
    if (error instanceof Refused) return { error: error.message };
    throw error;
  }

  refresh();
  return null;
}
