import { Suspense } from "react";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { BarChart, PieChart } from "@/components/reports/Charts";
import { ReportFilterForm } from "@/components/reports/ReportFilterForm";
import { ReportShell } from "@/components/reports/ReportShell";
import { db } from "@/lib/db";
import { formatDate, formatMonthDay, formatTime } from "@/lib/format";
import { addDateRange, readReportFilters, REPORTS } from "@/lib/reports";
import type { FlightLoadRow, RouteOptionRow } from "@/lib/types";

const STATUS_GROUPS = ["On schedule", "Delayed", "Cancelled"];
const cell = "py-2 pr-4";

function statusGroup(status: string): string {
  if (status === "DELAYED") return "Delayed";
  if (status === "CANCELLED") return "Cancelled";
  return "On schedule";
}

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
  const filters = readReportFilters(await searchParams);

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

  const flying = flights.filter((flight) => flight.flight_status_name !== "CANCELLED");
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
              {flights.map((flight) => (
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
                  <td className={cell}>
                    {flight.flight_status_name.charAt(0) + flight.flight_status_name.slice(1).toLowerCase()}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </AdminTile>
        </>
      )}
    </>
  );
}
