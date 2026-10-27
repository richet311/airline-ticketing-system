import "server-only";

import type { RowDataPacket } from "mysql2";

import type { BoardingPassData } from "@/components/check-in/BoardingPass";
import { boardingGroup, boardingTime } from "@/lib/checkIn";
import { db } from "@/lib/db";
import type { InboxMessage } from "@/lib/types";

const MESSAGE_COLUMNS = `notification_id, notification_type, booking_id, flight_id, e_ticket_number,
                         subject, body, is_read, created_at`;

// /account/notifications?show=unread&id=90001
export function inboxLink({ id, unreadOnly = false }: { id?: number; unreadOnly?: boolean }): string {
  const query = new URLSearchParams();
  if (unreadOnly) query.set("show", "unread");
  if (id) query.set("id", String(id));
  const text = query.toString();
  return text ? `/account/notifications?${text}` : "/account/notifications";
}

export async function getInbox(userId: number, unreadOnly: boolean): Promise<InboxMessage[]> {
  const [messages] = await db.query<InboxMessage[]>(
    `SELECT ${MESSAGE_COLUMNS}
       FROM notification
      WHERE user_id = ? ${unreadOnly ? "AND is_read = FALSE" : ""}
      ORDER BY created_at DESC, notification_id DESC`,
    [userId],
  );
  return messages;
}

export async function countUnread(userId: number): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS unread FROM notification WHERE user_id = ? AND is_read = FALSE",
    [userId],
  );
  return Number(rows[0].unread);
}

// null if its not theirs
export async function getMessage(userId: number, notificationId: number): Promise<InboxMessage | null> {
  const [messages] = await db.query<InboxMessage[]>(
    `SELECT ${MESSAGE_COLUMNS} FROM notification WHERE notification_id = ? AND user_id = ?`,
    [notificationId, userId],
  );
  return messages[0] ?? null;
}

export async function markRead(userId: number, notificationId: number): Promise<void> {
  await db.query(
    `UPDATE notification
        SET is_read = TRUE, read_at = NOW(), updated_by = ?, last_updated = NOW()
      WHERE notification_id = ? AND user_id = ? AND is_read = FALSE`,
    [userId, notificationId, userId],
  );
}

export async function markAllRead(userId: number): Promise<void> {
  await db.query(
    `UPDATE notification
        SET is_read = TRUE, read_at = NOW(), updated_by = ?, last_updated = NOW()
      WHERE user_id = ? AND is_read = FALSE`,
    [userId, userId],
  );
}

// reads the ticket live so gate changes show up. null if not checked in
export async function getBoardingPass(eTicketNumber: string): Promise<BoardingPassData | null> {
  const [tickets] = await db.query<RowDataPacket[]>(
    `SELECT t.e_ticket_number, t.seat_number, p.first_name, p.last_name,
            f.flight_number, f.departure_time,
            o.airport_code AS origin, o.city AS origin_city, o.timezone AS origin_timezone,
            d.airport_code AS destination, d.city AS destination_city,
            g.gate_number, cc.cabin_class_name
       FROM ticket t
       JOIN passenger p      ON p.passenger_id = t.passenger_id
       JOIN flight f         ON f.flight_id = t.flight_id
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
       LEFT JOIN gate g      ON g.gate_id = f.departure_gate_id
       JOIN fare_class fc    ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc   ON cc.cabin_class_id = fc.cabin_class_id
      WHERE t.e_ticket_number = ? AND t.checked_in = TRUE`,
    [eTicketNumber],
  );
  const ticket = tickets[0];
  if (!ticket) return null;

  return {
    eTicketNumber: ticket.e_ticket_number,
    passengerName: `${ticket.last_name ?? ""} / ${ticket.first_name ?? ""}`.toUpperCase(),
    flightNumber: ticket.flight_number,
    origin: ticket.origin,
    originCity: ticket.origin_city,
    destination: ticket.destination,
    destinationCity: ticket.destination_city,
    departureTime: ticket.departure_time,
    boardingTime: boardingTime(ticket.departure_time),
    timeZone: ticket.origin_timezone,
    gate: ticket.gate_number,
    seat: ticket.seat_number,
    cabin: ticket.cabin_class_name,
    group: boardingGroup(ticket.cabin_class_name),
  };
}
