// TODO: travel documents, bags, seat and boarding pass

import { Suspense } from "react";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";

import { checkIn } from "./actions";

export default function CheckInBookingPage({ params }: PageProps<"/check-in/[bookingId]">) {
  return (
    <>
      <h1>Check In</h1>
      <Suspense fallback={<p>Loading your booking...</p>}>
        <TravelerList params={params} />
      </Suspense>
    </>
  );
}

async function TravelerList({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;

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
          {ticket.checked_in === 1 ? (
            "Checked in"
          ) : (
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
