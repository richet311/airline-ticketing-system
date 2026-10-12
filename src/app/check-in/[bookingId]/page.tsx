// Check-in for one booking · mockup: "Check-in + boarding pass" (Phase 3)
// Task list (passengers, travel documents, bags, seat) and the boarding pass.
// Data: reads + saves (actions.ts in this folder).
//
// TEAM EXAMPLE: this page and actions.ts show the pattern every page follows:
// page.tsx READS from the database and shows it, actions.ts SAVES changes.
// Try it after loading the seeds: http://localhost:3000/check-in/AZ42KQ
// Still to build from the mockup: travel documents, bags, seat and the boarding pass.

import { Suspense } from "react";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";

import { checkIn } from "./actions";

// The page. Next.js runs it when someone opens /check-in/<confirmation code>.
// `params` holds the part of the URL that matched the [bookingId] folder:
// /check-in/AZ42KQ gives { bookingId: "AZ42KQ" }.
export default function CheckInBookingPage({ params }: PageProps<"/check-in/[bookingId]">) {
  return (
    <>
      <h1>Check In</h1>
      {/* Anything that waits on the URL or the database goes inside <Suspense>.
          The fallback shows until the data is ready. */}
      <Suspense fallback={<p>Loading your booking...</p>}>
        <TravelerList params={params} />
      </Suspense>
    </>
  );
}

// READS: loads every ticket on the booking and shows one line per traveler.
async function TravelerList({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;

  // One row per ticket, with the traveler's name and flight joined in.
  // The ? is filled in with bookingId. Never paste user input into the SQL text itself.
  const [tickets] = await db.query<RowDataPacket[]>(
    `SELECT t.e_ticket_number, t.seat_number, t.checked_in,
            p.first_name, p.last_name,
            f.flight_number, f.departure_time
       FROM ticket t
       JOIN passenger p ON p.passenger_id = t.passenger_id
       JOIN flight f ON f.flight_id = t.flight_id
      WHERE t.booking_id = ?`,
    [bookingId],
  );

  if (tickets.length === 0) {
    return <p>No booking found with confirmation code {bookingId}.</p>;
  }

  return (
    <ul>
      {tickets.map((ticket) => (
        <li key={ticket.e_ticket_number}>
          {ticket.first_name} {ticket.last_name}, flight {ticket.flight_number} departing{" "}
          {ticket.departure_time}, seat {ticket.seat_number}:{" "}
          {/* BOOLEAN columns come back as 1 or 0 */}
          {ticket.checked_in === 1 ? (
            "Checked in"
          ) : (
            // SAVES: submitting this form runs checkIn() from actions.ts on the server.
            // Each <input name="..."> becomes a value that checkIn() reads with formData.get("...").
            <form action={checkIn}>
              <input type="hidden" name="booking_id" value={bookingId} />
              <input type="hidden" name="e_ticket_number" value={ticket.e_ticket_number} />
              <button>Check in</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
