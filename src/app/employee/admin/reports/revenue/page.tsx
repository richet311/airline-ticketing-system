import { Suspense } from "react";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { pageNumber, TilePager } from "@/components/admin/TilePager";
import { BarChart } from "@/components/reports/Charts";
import { DetailFilterForm } from "@/components/reports/DetailFilterForm";
import { ReportFilterForm } from "@/components/reports/ReportFilterForm";
import { ReportShell } from "@/components/reports/ReportShell";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import {
  addDateRange,
  DEFAULT_MIN_TICKETS,
  matchesSearch,
  readDetailFilter,
  readReportFilters,
  REPORT_TABLE_SIZE,
  REPORTS,
} from "@/lib/reports";
import type { CabinClass, RouteAirportsRow, RouteRevenueRow, RouteTicketRow } from "@/lib/types";

const cell = "py-2 pr-4";

const TICKET_JOINS = `FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN flight_status fs  ON fs.flight_status_id = f.flight_status_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
       JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id`;

export default function RevenueReportPage({ searchParams }: PageProps<"/employee/admin/reports/revenue">) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <ReportShell report={REPORTS.revenue}>
        <RevenueReport searchParams={searchParams} />
      </ReportShell>
    </Suspense>
  );
}

async function RevenueReport({ searchParams }: { searchParams: PageProps<"/employee/admin/reports/revenue">["searchParams"] }) {
  const params = await searchParams;
  const filters = readReportFilters(params);
  const typedMinimum = Number(filters.minTickets);
  const minTickets = Number.isInteger(typedMinimum) && typedMinimum >= 1 ? typedMinimum : DEFAULT_MIN_TICKETS;

  const where = ["bs.booking_status_name = 'CONFIRMED'", "fs.flight_status_name <> 'CANCELLED'"];
  const values: (string | number)[] = [];
  addDateRange(where, values, "f.departure_time", filters);
  if (filters.cabin) {
    where.push("cc.cabin_class_name = ?");
    values.push(filters.cabin);
  }
  if (filters.origin) {
    where.push("o.airport_code = ?");
    values.push(filters.origin);
  }
  if (filters.destination) {
    where.push("d.airport_code = ?");
    values.push(filters.destination);
  }

  const [cabins] = await db.query<CabinClass[]>("SELECT * FROM cabin_class ORDER BY cabin_class_id");
  const [routes] = await db.query<RouteAirportsRow[]>(
    `SELECT DISTINCT o.airport_code AS origin, o.city AS origin_city, d.airport_code AS destination, d.city AS destination_city
       FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d        ON d.airport_id = f.destination_airport_id
      WHERE fs.flight_status_name <> 'CANCELLED'`,
  );
  const [rows] = await db.query<RouteRevenueRow[]>(
    `SELECT CONCAT(o.airport_code, ' → ', d.airport_code) AS route, f.distance,
            COUNT(DISTINCT f.flight_id) AS flights, COUNT(*) AS tickets,
            SUM(t.flight_fare) AS revenue, SUM(f.distance) AS passenger_miles,
            ROUND(SUM(t.flight_fare) / SUM(f.distance) * 100, 2) AS revenue_per_100_miles
       ${TICKET_JOINS}
      WHERE ${where.join(" AND ")}
      GROUP BY o.airport_code, d.airport_code, f.distance
      ORDER BY revenue_per_100_miles DESC`,
    values,
  );
  const [ticketRows] = await db.query<RouteTicketRow[]>(
    `SELECT t.e_ticket_number, t.booking_id, f.flight_number, f.departure_time,
            CONCAT(o.airport_code, ' → ', d.airport_code) AS route, f.distance,
            cc.cabin_class_name, t.flight_fare,
            ROUND(t.flight_fare / f.distance * 100, 2) AS fare_per_100_miles
       ${TICKET_JOINS}
      WHERE ${where.join(" AND ")}
      ORDER BY f.departure_time, f.flight_number, t.e_ticket_number`,
    values,
  );
  const ranked = rows.filter((row) => row.tickets >= minTickets);
  const page = pageNumber(params, "page", ranked.length, REPORT_TABLE_SIZE);
  const routeOrder = new Map(ranked.map((row, index) => [row.route, index]));
  const rankedTickets = ticketRows
    .filter((ticket) => routeOrder.has(ticket.route))
    .sort((a, b) => (routeOrder.get(a.route) ?? 0) - (routeOrder.get(b.route) ?? 0));
  const detailSearch = readDetailFilter(params, "search");
  const detailRoute = readDetailFilter(params, "route");
  const detailCabin = readDetailFilter(params, "cabin").toUpperCase();
  const shownTickets = rankedTickets.filter(
    (ticket) =>
      matchesSearch(detailSearch, [ticket.e_ticket_number, ticket.booking_id, ticket.flight_number]) &&
      (detailRoute === "" || ticket.route === detailRoute) &&
      (detailCabin === "" || ticket.cabin_class_name === detailCabin),
  );
  const ticketPage = pageNumber(params, "detail_page", shownTickets.length, REPORT_TABLE_SIZE);
  const tickets = (count: number) => `${count} ticket${count === 1 ? "" : "s"}`;
  const cabinLabel = (name: string) => name.charAt(0) + name.slice(1).toLowerCase();

  return (
    <>
      <ReportFilterForm
        action={REPORTS.revenue.href}
        filters={filters}
        routePairs={routes.map((route) => ({
          origin: route.origin,
          originCity: route.origin_city,
          destination: route.destination,
          destinationCity: route.destination_city,
        }))}
        cabins={cabins.map(({ cabin_class_name: name }) => ({ value: name, label: cabinLabel(name) }))}
        minTickets={minTickets}
      />

      <AdminTile title={`Routes with at least ${tickets(minTickets)}`}>
        <p className="mb-4 text-sm text-gray-600">
          Ticket revenue from confirmed bookings on scheduled flights, divided by the miles passengers flew on that route,
          per every 100 miles.
        </p>
        {ranked.length === 0 ? (
          <p className="text-sm text-gray-600">No route has at least {tickets(minTickets)} for these filters.</p>
        ) : (
          <>
            <BarChart data={ranked.map((row) => ({ label: row.route, value: row.revenue_per_100_miles }))} format={formatMoney} />
            <RouteTable rows={ranked.slice((page - 1) * REPORT_TABLE_SIZE, page * REPORT_TABLE_SIZE)} />
            <TilePager
              basePath={REPORTS.revenue.href}
              params={params}
              name="page"
              page={page}
              size={REPORT_TABLE_SIZE}
              total={ranked.length}
              noun="Routes"
            />
          </>
        )}
      </AdminTile>

      {rankedTickets.length > 0 && (
        <AdminTile overline="Detail" title="Tickets on these routes">
          <p className="mb-4 text-sm text-gray-600">Every ticket above, in the route order it appears in.</p>
          <DetailFilterForm
            action={REPORTS.revenue.href}
            params={params}
            searchPlaceholder="Ticket, booking or flight"
            choices={[
              {
                name: "route",
                label: "Route",
                allLabel: "All routes",
                options: ranked.map((row) => ({ value: row.route, label: row.route })),
              },
              {
                name: "cabin",
                label: "Cabin",
                allLabel: "All cabins",
                options: cabins.map(({ cabin_class_name: name }) => ({ value: name, label: cabinLabel(name) })),
              },
            ]}
            matched={shownTickets.length}
            total={rankedTickets.length}
            noun="tickets"
          />
          {shownTickets.length === 0 ? (
            <p className="text-sm text-gray-600">No tickets match this search.</p>
          ) : (
            <AdminTable headings={["Ticket", "Flight", "Departs (UTC)", "Route", "Cabin", "Miles", "Fare paid", "Fare / 100 mi"]}>
              {shownTickets.slice((ticketPage - 1) * REPORT_TABLE_SIZE, ticketPage * REPORT_TABLE_SIZE).map((ticket) => (
                <tr key={ticket.e_ticket_number}>
                  <td className={`${cell} font-semibold`}>{ticket.e_ticket_number}</td>
                  <td className={cell}>{ticket.flight_number}</td>
                  <td className={cell}>
                    {formatDate(ticket.departure_time)}, {formatTime(ticket.departure_time)}
                  </td>
                  <td className={cell}>{ticket.route}</td>
                  <td className={cell}>{cabinLabel(ticket.cabin_class_name)}</td>
                  <td className={cell}>{ticket.distance.toLocaleString("en-US")}</td>
                  <td className={cell}>{formatMoney(ticket.flight_fare)}</td>
                  <td className={cell}>{formatMoney(ticket.fare_per_100_miles)}</td>
                </tr>
              ))}
            </AdminTable>
          )}
          <TilePager
            basePath={REPORTS.revenue.href}
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
  );
}

function RouteTable({ rows }: { rows: RouteRevenueRow[] }) {
  return (
    <AdminTable headings={["Route", "Miles", "Flights", "Tickets", "Passenger-miles", "Revenue", "Revenue / 100 mi"]}>
      {rows.map((row) => (
        <tr key={row.route}>
          <td className={`${cell} font-semibold`}>{row.route}</td>
          <td className={cell}>{row.distance.toLocaleString("en-US")}</td>
          <td className={cell}>{row.flights}</td>
          <td className={cell}>{row.tickets}</td>
          <td className={cell}>{row.passenger_miles.toLocaleString("en-US")}</td>
          <td className={cell}>{formatMoney(row.revenue)}</td>
          <td className={cell}>{formatMoney(row.revenue_per_100_miles)}</td>
        </tr>
      ))}
    </AdminTable>
  );
}
