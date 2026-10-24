import { AdminTile } from "@/components/admin/AdminTile";
import { db } from "@/lib/db";
import type { AgentFareRow, AvailableSeatRow, BookingStatus, BookingTicketRow, TicketBagRow } from "@/lib/types";

import { BookingsEditor } from "./BookingsEditor";

//booking tile
export async function BookingsTile() {
  const [tickets] = await db.query<BookingTicketRow[]>(
    `SELECT t.e_ticket_number, t.booking_id, t.flight_id, t.fare_class_id, t.seat_number, t.flight_fare,
            p.first_name, p.last_name, f.flight_number, o.airport_code AS origin, d.airport_code AS destination,
            f.departure_time, o.timezone AS origin_timezone, fs.flight_status_name, cc.cabin_class_name,
            b.total_amount, bs.booking_status_name,
            (SELECT COALESCE(SUM(CASE pay.payment_status WHEN 'RECEIVED' THEN pay.total_amount
                                                         WHEN 'REFUNDED' THEN -pay.total_amount ELSE 0 END), 0)
               FROM payment pay WHERE pay.booking_id = b.booking_id) AS paid_amount
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN passenger p       ON p.passenger_id = t.passenger_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN flight_status fs  ON fs.flight_status_id = f.flight_status_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
       JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id
      WHERE fs.flight_status_name <> 'ARRIVED'
      ORDER BY b.booking_id, f.departure_time, t.e_ticket_number`,
  );
  const flightIds = [...new Set(tickets.map((ticket) => ticket.flight_id))];
  const ticketIds = tickets.map((ticket) => ticket.e_ticket_number);

  //The change fee for every fare
  const [fares] = flightIds.length
    ? await db.query<AgentFareRow[]>(
        `SELECT fc.fare_class_id, fc.flight_id, cc.cabin_class_name, fc.base_price, fc.seats_available,
                fc.is_refundable, fc.change_fee
           FROM fare_class fc
           JOIN cabin_class cc ON cc.cabin_class_id = fc.cabin_class_id
          WHERE fc.flight_id IN (?)
          ORDER BY fc.cabin_class_id`,
        [flightIds],
      )
    : [[] as AgentFareRow[]];

  const [seats] = flightIds.length
    ? await db.query<AvailableSeatRow[]>(
        `SELECT fc.fare_class_id, s.seat_number
           FROM seat s
           JOIN fare_class fc ON fc.flight_id = s.flight_id AND fc.cabin_class_id = s.cabin_class_id
          WHERE s.flight_id IN (?)
            AND s.seat_status_id = (SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'AVAILABLE')
          ORDER BY CAST(s.seat_number AS UNSIGNED), s.seat_number`,
        [flightIds],
      )
    : [[] as AvailableSeatRow[]];

  const [bags] = ticketIds.length
    ? await db.query<TicketBagRow[]>(
        "SELECT tag_number, e_ticket_number, weightage FROM baggage WHERE e_ticket_number IN (?) ORDER BY created_at, tag_number",
        [ticketIds],
      )
    : [[] as TicketBagRow[]];
  const [statuses] = await db.query<BookingStatus[]>("SELECT * FROM booking_status ORDER BY booking_status_id");

  const seatsByFare: Record<number, string[]> = {};
  for (const seat of seats) (seatsByFare[seat.fare_class_id] ??= []).push(seat.seat_number);
  
  const bagWeights: Record<string, number[]> = {};
  for (const bag of bags) (bagWeights[bag.e_ticket_number] ??= []).push(Number(bag.weightage));

  return (
    <AdminTile overline="Customer service" title="Bookings">
      <BookingsEditor
        tickets={tickets}
        fares={fares}
        seatsByFare={seatsByFare}
        bagWeights={bagWeights}
        statuses={statuses.map((status) => status.booking_status_name)}
      />
    </AdminTile>
  );
}
