"use server";

import { refresh } from "next/cache";
import type { RowDataPacket } from "mysql2";

import { checkInState, travelerProblem, type CheckInState } from "@/lib/checkIn";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canOpenTrip } from "@/lib/tripAccess";

// guests are saved as the system user
const SYSTEM_USER_ID = 1;

export type CheckInResult = { error: string } | null;

function refusedMessage(state: CheckInState): string {
  switch (state) {
    case "unpaid":
      return "This booking isn't paid yet. Finish payment before you check in.";
    case "booking-cancelled":
      return "This booking was cancelled.";
    case "flight-cancelled":
      return "This flight was cancelled.";
    case "done":
      return "Everyone selected is already checked in.";
    case "delayed":
      return "Check-in is closed while the flight is delayed.";
    case "closed":
      return "Check-in for this flight has closed.";
    case "not-open":
      return "Check-in hasn't opened yet. It opens 24 hours before departure.";
    default:
      return "Check-in isn't available for this booking.";
  }
}

// re-checks everything the page checks
export async function checkIn(previousState: CheckInResult, formData: FormData): Promise<CheckInResult> {
  const bookingId = String(formData.get("booking_id") ?? "").trim().toUpperCase();
  const ticketNumbers = formData.getAll("e_ticket_number").map(String);
  const hazmatConfirmed = formData.get("hazmat") === "on";

  if (ticketNumbers.length === 0) return { error: "Choose at least one traveler to check in." };
  if (!hazmatConfirmed) return { error: "Confirm you're not carrying hazardous materials." };

  if (!(await canOpenTrip(bookingId))) {
    return { error: "Look up your trip again with your last name, then check in." };
  }

  // uses mysql's clock (utc)
  const [tickets] = await db.query<RowDataPacket[]>(
    `SELECT t.e_ticket_number, t.seat_number, t.checked_in, t.flight_id,
            b.booking_status_id, f.flight_status_id, f.departure_time,
            TIMESTAMPDIFF(MINUTE, NOW(), f.departure_time) AS minutes_to_departure,
            p.first_name, p.passport_number, p.passport_expiry_date,
            o.country AS origin_country, d.country AS destination_country
       FROM ticket t
       JOIN booking b   ON b.booking_id = t.booking_id
       JOIN passenger p ON p.passenger_id = t.passenger_id
       JOIN flight f    ON f.flight_id = t.flight_id
       JOIN airport o   ON o.airport_id = f.origin_airport_id
       JOIN airport d   ON d.airport_id = f.destination_airport_id
      WHERE t.booking_id = ? AND t.e_ticket_number IN (?)`,
    [bookingId, ticketNumbers],
  );
  if (tickets.length !== ticketNumbers.length) {
    return { error: "Some of these tickets aren't on this booking. Reload the page and try again." };
  }
  if (new Set(tickets.map((ticket) => ticket.flight_id)).size !== 1) {
    return { error: "Check in for one flight at a time." };
  }

  const first = tickets[0];
  const state = checkInState({
    bookingStatusId: first.booking_status_id,
    flightStatusId: first.flight_status_id,
    minutesToDeparture: first.minutes_to_departure,
    allCheckedIn: tickets.every((ticket) => ticket.checked_in === 1),
  });
  if (state !== "open") return { error: refusedMessage(state) };

  for (const ticket of tickets) {
    const problem = travelerProblem({
      seatNumber: ticket.seat_number,
      international: ticket.origin_country !== ticket.destination_country,
      passportNumber: ticket.passport_number,
      passportExpiry: ticket.passport_expiry_date,
      departureTime: ticket.departure_time,
    });
    if (problem) return { error: `${ticket.first_name ?? "A traveler"}: ${problem}` };
  }

  // one update so its all or nothing
  const user = await getCurrentUser();
  await db.query(
    `UPDATE ticket
        SET checked_in = 1, updated_by = ?, last_updated = NOW()
      WHERE booking_id = ? AND e_ticket_number IN (?) AND (checked_in IS NULL OR checked_in = 0)`,
    [user?.user_id ?? SYSTEM_USER_ID, bookingId, ticketNumbers],
  );

  refresh();
  return null;
}
