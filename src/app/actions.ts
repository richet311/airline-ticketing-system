"use server";

// Server Actions for Home (page.tsx in this folder): the booking card's Check In and My Trips
// tabs (src/components/home/BookingCard.tsx).
// Functions in this file run on the server and can read and change the database.
//
// TEAM EXAMPLE: findTrip() shows a SELECT inside an action. For an UPDATE, see
// src/app/check-in/[bookingId]/actions.ts.
//
// Why the Book tab has no action: searching saves nothing and nothing in it is private, so its
// form just opens /book/results with the search in the URL, and that page runs the SELECT.
// Check In and My Trips ask for a last name, which should not end up in the URL (browser
// history), so those two forms send it to findTrip() instead.

import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";

// What findTrip sends back to the form when it cannot open the trip: the message to show, and
// what was typed, so the form can put it back (a form clears itself after its action runs).
// null = nothing to show yet.
export type FindTripState = { error: string; bookingId: string; lastName: string } | null;

// findTrip: the Check In and My Trips tabs. If the confirmation code and last name match a
// booking, it opens /check-in/<code> or /my-trips/<code>. If not, it returns a message.
// Parameters (useActionState in BookingCard.tsx passes both in):
// - previousState  what findTrip returned last time (not needed here)
// - formData       the submitted form: booking_id, last_name and go_to
// Database: booking_id is booking.booking_id, last_name is passenger.last_name of the person who
// made the booking (booking.passenger_id).
export async function findTrip(previousState: FindTripState, formData: FormData): Promise<FindTripState> {
  // 1. Read the form. Every value arrives as text.
  const bookingId = String(formData.get("booking_id")).trim().toUpperCase();
  const lastName = String(formData.get("last_name")).trim();
  // Anyone can send any value, so only accept the two pages we expect.
  const goTo = formData.get("go_to") === "my-trips" ? "my-trips" : "check-in";

  // 2. SELECT: find the booking. RowDataPacket[] = a list of rows; empty means no match.
  //    The ? marks are filled from the array, in order. Never paste form values into the SQL.
  //    MySQL compares text without caring about capitals, so "singleadult" matches SINGLEADULT.
  const [bookings] = await db.query<RowDataPacket[]>(
    `SELECT b.booking_id
       FROM booking b
       JOIN passenger p ON p.passenger_id = b.passenger_id
      WHERE b.booking_id = ? AND p.last_name = ?`,
    [bookingId, lastName],
  );

  // 3. No match: a typo is normal, so return a message for the form instead of throwing.
  if (bookings.length === 0) {
    return { error: "We couldn't find a trip with that confirmation code and last name.", bookingId, lastName };
  }

  // 4. Match: open the trip's page. redirect() ends the function here.
  redirect(`/${goTo}/${bookingId}`);
}
