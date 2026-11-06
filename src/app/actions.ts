"use server";

import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { rememberTrip } from "@/lib/tripAccess";

// Sent back to the form when the trip isn't found
export type FindTripState = { error: string; bookingId: string; lastName: string } | null;

// Looks up a booking by confirmation code and the last name of the booker or any traveler on it,
// then opens Check In or My Trips. The lookup is remembered so those pages open for this browser.
export async function findTrip(previousState: FindTripState, formData: FormData): Promise<FindTripState> {
  const bookingId = String(formData.get("booking_id")).trim().toUpperCase();
  const lastName = String(formData.get("last_name")).trim();
  // only allow these two pages
  const goTo = formData.get("go_to") === "my-trips" ? "my-trips" : "check-in";

  const [bookings] = await db.query<RowDataPacket[]>(
    `SELECT b.booking_id
       FROM booking b
       JOIN passenger p ON p.passenger_id = b.passenger_id
      WHERE b.booking_id = ?
        AND (p.last_name = ?
             OR EXISTS (SELECT 1
                          FROM ticket t
                          JOIN passenger tp ON tp.passenger_id = t.passenger_id
                         WHERE t.booking_id = b.booking_id AND tp.last_name = ?))`,
    [bookingId, lastName, lastName],
  );

  if (bookings.length === 0 || lastName === "") {
    return { error: "We couldn't find a trip with that confirmation code and last name.", bookingId, lastName };
  }

  await rememberTrip(bookings[0].booking_id);
  redirect(`/${goTo}/${bookingId}`);
}
