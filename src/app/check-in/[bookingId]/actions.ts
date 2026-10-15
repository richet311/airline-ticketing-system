"use server";

// Server Actions for /check-in/[bookingId] (page.tsx in this folder).
// Functions in this file run on the server and can change the database.
// The page's forms call them: <form action={functionName}>.
// Each function must check that the person is allowed to make this change before it saves.
//
// TEAM EXAMPLE: checkIn() below is a working example. Follow its four steps in your own actions.

import { refresh } from "next/cache";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";

// Guests check in without an account, so the change is recorded under user 1,
// the system account in the seeds (user.user_id 1, written to ticket.updated_by).
const SYSTEM_USER_ID = 1;

// checkIn: marks one traveler as checked in for their flight (ticket.checked_in 0 -> 1).
// Called by the "Check in" button on page.tsx, which sends booking_id and e_ticket_number.
// FormData is the browser's type for a submitted form: formData.get("name") returns the value
// of the input with that name. Database: booking_id is booking.booking_id, e_ticket_number
// is ticket.e_ticket_number.
export async function checkIn(formData: FormData) {
  // 1. Read what the form sent. Form values always arrive as text.
  const bookingId = String(formData.get("booking_id"));
  const ticketNumber = String(formData.get("e_ticket_number"));

  // 2. Check that the change is allowed. Anyone can send these values, not only our form,
  //    so make sure the ticket belongs to this booking and the booking is CONFIRMED.
  //    RowDataPacket[] = a list of rows. An empty list means no ticket matched.
  const [allowed] = await db.query<RowDataPacket[]>(
    `SELECT t.e_ticket_number
       FROM ticket t
       JOIN booking b ON b.booking_id = t.booking_id
       JOIN booking_status s ON s.booking_status_id = b.booking_status_id
      WHERE t.e_ticket_number = ? AND t.booking_id = ? AND s.booking_status_name = 'CONFIRMED'`,
    [ticketNumber, bookingId],
  );
  if (allowed.length === 0) {
    throw new Error("This ticket cannot be checked in.");
  }

  // 3. Save the change, and fill in who changed it and when (the audit columns).
  await db.query(
    `UPDATE ticket
        SET checked_in = 1, updated_by = ?, last_updated = NOW()
      WHERE e_ticket_number = ?`,
    [SYSTEM_USER_ID, ticketNumber],
  );

  // 4. Re-run page.tsx so the traveler now shows "Checked in".
  refresh();
}
