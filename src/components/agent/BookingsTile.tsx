import type { RowDataPacket } from "mysql2";
import Form from "next/form";
import Link from "next/link";

import { AdminTile, adminButtonClass, adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";
import { TilePager } from "@/components/admin/TilePager";
import { RoutePicker } from "@/components/reports/RoutePicker";
import { db } from "@/lib/db";
import type {
  AgentFareRow,
  AvailableSeatRow,
  BookingStatus,
  BookingTicketRow,
  RouteAirportsRow,
  TicketBagRow,
} from "@/lib/types";

import { BookingsEditor } from "./BookingsEditor";

type SearchParams = { [key: string]: string | string[] | undefined };

const PAGE_SIZE = 20;
const FILTER_NAMES = ["booking", "flight", "origin", "destination"] as const;

const TICKET_JOINS = `
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN flight_status fs  ON fs.flight_status_id = f.flight_status_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id`;

function urlValue(params: SearchParams, name: string): string {
  const value = params[name];
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim().toUpperCase();
}

export function bookingFilterParams(params: SearchParams): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const name of [...FILTER_NAMES, "page", "hide_past"]) {
    if (urlValue(params, name)) kept[name] = urlValue(params, name);
  }
  return kept;
}

//booking tile
export async function BookingsTile({ params, basePath }: { params: SearchParams; basePath: string }) {
  const filters = Object.fromEntries(FILTER_NAMES.map((name) => [name, urlValue(params, name)])) as Record<
    (typeof FILTER_NAMES)[number],
    string
  >;
  const gateFlight = urlValue(params, "gate_flight");
  const hidePast = urlValue(params, "hide_past") === "1";
  const statusCondition = hidePast
    ? "fs.flight_status_name NOT IN ('DEPARTED', 'ARRIVED')"
    : "fs.flight_status_name <> 'ARRIVED'";

  const problems: string[] = [];
  if (filters.booking) {
    const [found] = await db.query<RowDataPacket[]>("SELECT 1 FROM booking WHERE booking_id = ?", [filters.booking]);
    if (found.length === 0) problems.push("Please enter a valid booking ID");
  }
  if (filters.flight) {
    const [found] = await db.query<RowDataPacket[]>("SELECT 1 FROM flight WHERE flight_number = ? LIMIT 1", [filters.flight]);
    if (found.length === 0) problems.push("Please enter a valid flight number");
  }

  const [routes] = await db.query<RouteAirportsRow[]>(
    `SELECT DISTINCT o.airport_code AS origin, o.city AS origin_city, d.airport_code AS destination, d.city AS destination_city
       FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
      WHERE ${statusCondition}`,
  );

  const where = [statusCondition];
  const values: string[] = [];
  const conditions = { booking: "b.booking_id = ?", flight: "f.flight_number = ?", origin: "o.airport_code = ?", destination: "d.airport_code = ?" };
  for (const name of FILTER_NAMES) {
    if (filters[name]) {
      where.push(conditions[name]);
      values.push(filters[name]);
    }
  }

  let total = 0;
  let page = 1;
  let bookingIds: string[] = [];
  if (problems.length === 0) {
    const [[counted]] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT b.booking_id) AS total ${TICKET_JOINS} WHERE ${where.join(" AND ")}`,
      values,
    );
    total = Number(counted.total);
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(Math.max(1, Math.floor(Number(urlValue(params, "page")) || 1)), lastPage);

    const [pageRows] = await db.query<RowDataPacket[]>(
      `SELECT b.booking_id ${TICKET_JOINS}
        WHERE ${where.join(" AND ")}
        GROUP BY b.booking_id
        ORDER BY MIN(f.departure_time), b.booking_id
        LIMIT ? OFFSET ?`,
      [...values, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    bookingIds = pageRows.map((row) => row.booking_id as string);
  }

  const [tickets] = bookingIds.length
    ? await db.query<BookingTicketRow[]>(
        `SELECT t.e_ticket_number, t.booking_id, t.flight_id, t.fare_class_id, t.seat_number, t.flight_fare,
                p.first_name, p.last_name, f.flight_number, o.airport_code AS origin, d.airport_code AS destination,
                f.departure_time, o.timezone AS origin_timezone, fs.flight_status_name, cc.cabin_class_name,
                b.total_amount, bs.booking_status_name,
                (SELECT COALESCE(SUM(CASE pay.payment_status WHEN 'RECEIVED' THEN pay.total_amount
                                                             WHEN 'REFUNDED' THEN -pay.total_amount ELSE 0 END), 0)
                   FROM payment pay WHERE pay.booking_id = b.booking_id) AS paid_amount
           ${TICKET_JOINS}
           JOIN passenger p       ON p.passenger_id = t.passenger_id
           JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
           JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id
          WHERE ${where.join(" AND ")} AND b.booking_id IN (?)
          ORDER BY f.departure_time, b.booking_id, t.e_ticket_number`,
        [...values, bookingIds],
      )
    : [[] as BookingTicketRow[]];
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

  const kept = { ...filters, gate_flight: gateFlight, hide_past: hidePast ? "1" : "" };
  const hrefFor = (extra: Record<string, string>) => {
    const query = new URLSearchParams(Object.entries({ ...kept, ...extra }).filter(([, value]) => value !== ""));
    return query.size > 0 ? `${basePath}?${query}` : basePath;
  };

  return (
    <AdminTile overline="Customer service" title="Bookings">
      <Form key={JSON.stringify(filters)} action={basePath} scroll={false} className="mb-2 flex flex-wrap items-end gap-3">
        {gateFlight && <input type="hidden" name="gate_flight" value={gateFlight} />}
        {hidePast && <input type="hidden" name="hide_past" value="1" />}
        <label className="w-32">
          <span className={adminLabelClass}>Booking</span>
          <input name="booking" defaultValue={filters.booking} placeholder="AZ43AA" maxLength={6} className={`${adminInputClass} uppercase`} />
        </label>
        <label className="w-32">
          <span className={adminLabelClass}>Flight</span>
          <input name="flight" defaultValue={filters.flight} placeholder="AZ101" maxLength={10} className={`${adminInputClass} uppercase`} />
        </label>
        <RoutePicker
          routes={routes.map((route) => ({
            origin: route.origin,
            originCity: route.origin_city,
            destination: route.destination,
            destinationCity: route.destination_city,
          }))}
          origin={filters.origin}
          destination={filters.destination}
        />
        <button type="submit" className={adminButtonClass}>
          Apply
        </button>
        <Link
          href={hrefFor({ booking: "", flight: "", origin: "", destination: "" })}
          scroll={false}
          className="flex h-9 items-center text-sm font-semibold text-azure-blue hover:underline"
        >
          Clear
        </Link>
        <Link
          href={hrefFor({ hide_past: hidePast ? "" : "1", page: "" })}
          scroll={false}
          role="switch"
          aria-checked={hidePast}
          className="ml-2 flex h-9 items-center gap-2 text-sm text-gray-700"
        >
          <span className={`relative h-5 w-9 rounded-full ${hidePast ? "bg-azure-blue" : "bg-gray-300"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${hidePast ? "left-4.5" : "left-0.5"}`} />
          </span>
          Hide departed flights
        </Link>
      </Form>

      {problems.length > 0 ? (
        problems.map((problem) => (
          <p key={problem} role="alert" className="mt-3 text-sm text-amber-700">
            {problem}
          </p>
        ))
      ) : total === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No bookings match these filters.</p>
      ) : (
        <>
          <BookingsEditor
            key={hrefFor({ page: String(page) })}
            tickets={tickets}
            fares={fares}
            seatsByFare={seatsByFare}
            bagWeights={bagWeights}
            statuses={statuses.map((status) => status.booking_status_name)}
          />
          <TilePager basePath={basePath} params={params} name="page" page={page} size={PAGE_SIZE} total={total} noun="Bookings" />
        </>
      )}
    </AdminTile>
  );
}
