"use server";

import { refresh } from "next/cache";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";

// guests are saved as the system user for now
const SYSTEM_USER_ID = 1;

// Marks one traveler as checked in (ticket.checked_in = 1).
export async function checkIn(formData: FormData) {
  const bookingId = String(formData.get("booking_id"));
  const ticketNumber = String(formData.get("e_ticket_number"));

  // make sure the ticket belongs to this booking and the booking is CONFIRMED
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

  await db.query(
    `UPDATE ticket
        SET checked_in = 1, updated_by = ?, last_updated = NOW()
      WHERE e_ticket_number = ?`,
    [SYSTEM_USER_ID, ticketNumber],
  );

  refresh();
}
