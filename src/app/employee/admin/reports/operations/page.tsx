import { Suspense } from "react";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { pageNumber, TilePager } from "@/components/admin/TilePager";
import { BarChart, PieChart } from "@/components/reports/Charts";
import { DetailFilterForm } from "@/components/reports/DetailFilterForm";
import { ReportFilterForm } from "@/components/reports/ReportFilterForm";
import { ReportShell } from "@/components/reports/ReportShell";
import { db } from "@/lib/db";
import { formatDate, formatMonthDay, formatTime } from "@/lib/format";
import {
  addDateRange,
  matchesSearch,
  readDetailFilter,
  readReportFilters,
  REPORT_TABLE_SIZE,
  REPORTS,
  STATUS_GROUPS,
  statusGroup,
} from "@/lib/reports";
import type { FlightLoadRow, FlightTicketRow, RouteOptionRow } from "@/lib/types";

const cell = "py-2 pr-4";
const CABIN_ORDER = ["ECONOMY", "PREMIUM", "BUSINESS", "FIRST"];
const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function OperationsReportPage({ searchParams }: PageProps<"/employee/admin/reports/operations">) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <ReportShell report={REPORTS.operations}>
        <OperationsReport searchParams={searchParams} />
      </ReportShell>
    </Suspense>
  );
}

async function OperationsReport({
  searchParams,
}: {
  searchParams: PageProps<"/employee/admin/reports/operations">["searchParams"];
}) {
  const params = await searchParams;
  const filters = readReportFilters(params);

  const where: string[] = [];
  const values: (string | number)[] = [];
  addDateRange(where, values, "f.departure_time", filters);
  const [origin, destination] = filters.route.split("-");
  if (origin && destination) {
    where.push("o.airport_code = ? AND d.airport_code = ?");
    values.push(origin, destination);
  }

  const [routes] = await db.query<RouteOptionRow[]>(
    `SELECT DISTINCT o.airport_code AS origin, d.airport_code AS destination
       FROM flight f
       JOIN airport o ON o.airport_id = f.origin_airport_id
       JOIN airport d ON d.airport_id = f.destination_airport_id
      ORDER BY origin, destination`,
  );
  const [flights] = await db.query<FlightLoadRow[]>(
    `SELECT f.flight_id, f.flight_number, f.departure_time,
            CONCAT(o.airport_code, ' → ', d.airport_code) AS route,
            a.aircraft_number, a.capacity, fs.flight_status_name,
            COUNT(CASE WHEN bs.booking_status_name = 'CONFIRMED' THEN 1 END) AS seats_sold,
            ROUND(COUNT(CASE WHEN bs.booking_status_name = 'CONFIRMED' THEN 1 END) * 100 / a.capacity, 1) AS load_factor
       FROM flight f
       JOIN airport o              ON o.airport_id = f.origin_airport_id
       JOIN airport d              ON d.airport_id = f.destination_airport_id
       JOIN aircraft a             ON a.aircraft_id = f.aircraft_id
       JOIN flight_status fs       ON fs.flight_status_id = f.flight_status_id
       LEFT JOIN ticket t          ON t.flight_id = f.flight_id
       LEFT JOIN booking b         ON b.booking_id = t.booking_id
       LEFT JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY f.flight_id, f.flight_number, f.departure_time, o.airport_code, d.airport_code,
               a.aircraft_number, a.capacity, fs.flight_status_name
      ORDER BY f.departure_time`,
    values,
  );

  const [tickets] = await db.query<FlightTicketRow[]>(
    `SELECT t.e_ticket_number, t.booking_id, f.flight_number, f.departure_time, t.seat_number,
            cc.cabin_class_name, bs.booking_status_name
       FROM ticket t
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY f.departure_time, f.flight_number, CAST(t.seat_number AS UNSIGNED), t.seat_number, t.e_ticket_number`,
    values,
  );

  const flying = flights.filter((flight) => flight.flight_status_name !== "CANCELLED");
  const page = pageNumber(params, "page", flights.length, REPORT_TABLE_SIZE);
  const label = (name: string) => name.charAt(0) + name.slice(1).toLowerCase();

  // the detail table's own filters; "counts as sold" is what the Sold column and seats filled are built from
  const detailSearch = readDetailFilter(params, "search");
  const detailFlight = readDetailFilter(params, "flight").toUpperCase();
  const detailCabin = readDetailFilter(params, "cabin").toUpperCase();
  const detailSold = readDetailFilter(params, "sold");
  const shownTickets = tickets.filter((ticket) => {
    const sold = ticket.booking_status_name === "CONFIRMED";
    return (
      matchesSearch(detailSearch, [ticket.e_ticket_number, ticket.booking_id, ticket.flight_number, ticket.seat_number]) &&
      (detailFlight === "" || ticket.flight_number === detailFlight) &&
      (detailCabin === "" || ticket.cabin_class_name === detailCabin) &&
      (detailSold === "" || (detailSold === "yes") === sold)
    );
  });
  const ticketPage = pageNumber(params, "detail_page", shownTickets.length, REPORT_TABLE_SIZE);
  const flightChoices = new Map(
    flights.map((flight) => [flight.flight_number, `${flight.flight_number} · ${formatMonthDay(flight.departure_time)}`]),
  );
  const cabinChoices = CABIN_ORDER.filter((cabin) => tickets.some((ticket) => ticket.cabin_class_name === cabin));
  const averageLoad = flying.length === 0 ? 0 : flying.reduce((sum, flight) => sum + flight.load_factor, 0) / flying.length;
  const percent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <>
      <ReportFilterForm
        action={REPORTS.operations.href}
        filters={filters}
        routes={routes.map((route) => ({
          value: `${route.origin}-${route.destination}`,
          label: `${route.origin} → ${route.destination}`,
        }))}
      />

      {flights.length === 0 ? (
        <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600">No flights match these filters.</p>
      ) : (
        <>
          <AdminTile overline="On-time performance" title="Flights by status">
            <p className="mb-4 text-sm text-gray-600">
              {flights.length} flights in this range. Scheduled, boarding, departed and arrived flights count as on
              schedule.
            </p>
            <PieChart
              data={STATUS_GROUPS.map((group) => ({
                label: group,
                value: flights.filter((flight) => statusGroup(flight.flight_status_name) === group).length,
              })).filter((slice) => slice.value > 0)}
              format={(count) => `${count} flight${count === 1 ? "" : "s"}`}
            />
          </AdminTile>

          <AdminTile overline="Seats Filled" title="Percentage of seats sold by flight capacity">
            <p className="mb-4 text-sm text-gray-600">Flights that aren&apos;t cancelled average {percent(averageLoad)} full.</p>
            <BarChart
              data={flights.map((flight) => ({
                label: `${flight.flight_number} · ${formatMonthDay(flight.departure_time)}`,
                value: flight.load_factor,
              }))}
              format={percent}
              max={100}
            />
            <AdminTable headings={["Flight", "Departs (UTC)", "Route", "Aircraft", "Seats", "Sold", "Seats filled", "Status"]}>
              {flights.slice((page - 1) * REPORT_TABLE_SIZE, page * REPORT_TABLE_SIZE).map((flight) => (
                <tr key={flight.flight_id}>
                  <td className={`${cell} font-semibold`}>{flight.flight_number}</td>
                  <td className={cell}>
                    {formatDate(flight.departure_time)}, {formatTime(flight.departure_time)}
                  </td>
                  <td className={cell}>{flight.route}</td>
                  <td className={cell}>{flight.aircraft_number}</td>
                  <td className={cell}>{flight.capacity}</td>
                  <td className={cell}>{flight.seats_sold}</td>
                  <td className={cell}>{percent(flight.load_factor)}</td>
                  <td className={cell}>{label(flight.flight_status_name)}</td>
                </tr>
              ))}
            </AdminTable>
            <TilePager
              basePath={REPORTS.operations.href}
              params={params}
              name="page"
              page={page}
              size={REPORT_TABLE_SIZE}
              total={flights.length}
              noun="Flights"
            />
          </AdminTile>

          {tickets.length > 0 && (
            <AdminTile overline="Detail" title="Tickets on these flights">
              <p className="mb-4 text-sm text-gray-600">Every ticket above, in the flight order it appears in.</p>
              <DetailFilterForm
                action={REPORTS.operations.href}
                params={params}
                searchPlaceholder="Ticket, booking, flight or seat"
                choices={[
                  {
                    name: "flight",
                    label: "Flight",
                    allLabel: "All flights",
                    options: [...flightChoices].map(([value, text]) => ({ value, label: text })),
                  },
                  { name: "cabin", label: "Cabin", allLabel: "All cabins", options: cabinChoices.map((cabin) => ({ value: cabin, label: label(cabin) })) },
                  { name: "sold", label: "Counts as sold", allLabel: "All", options: YES_NO },
                ]}
                matched={shownTickets.length}
                total={tickets.length}
                noun="tickets"
              />
              {shownTickets.length === 0 ? (
                <p className="text-sm text-gray-600">No tickets match this search.</p>
              ) : (
                <AdminTable headings={["Flight", "Departs (UTC)", "Ticket", "Booking", "Seat", "Cabin", "Booking status", "Counts as sold"]}>
                  {shownTickets.slice((ticketPage - 1) * REPORT_TABLE_SIZE, ticketPage * REPORT_TABLE_SIZE).map((ticket) => (
                    <tr key={ticket.e_ticket_number}>
                      <td className={`${cell} font-semibold`}>{ticket.flight_number}</td>
                      <td className={cell}>
                        {formatDate(ticket.departure_time)}, {formatTime(ticket.departure_time)}
                      </td>
                      <td className={cell}>{ticket.e_ticket_number}</td>
                      <td className={cell}>{ticket.booking_id}</td>
                      <td className={cell}>{ticket.seat_number ?? "—"}</td>
                      <td className={cell}>{label(ticket.cabin_class_name)}</td>
                      <td className={cell}>{label(ticket.booking_status_name)}</td>
                      <td className={cell}>{ticket.booking_status_name === "CONFIRMED" ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </AdminTable>
              )}
              <TilePager
                basePath={REPORTS.operations.href}
                params={params}
                name="detail_page"
                page={ticketPage}
                size={REPORT_TABLE_SIZE}
                total={shownTickets.length}
                noun="Tickets"
              />
            </AdminTile>
          )}
        </>
      )}
    </>
  );
}
