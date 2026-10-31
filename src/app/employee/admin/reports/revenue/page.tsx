import { Suspense } from "react";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { BarChart } from "@/components/reports/Charts";
import { ReportFilterForm } from "@/components/reports/ReportFilterForm";
import { ReportShell } from "@/components/reports/ReportShell";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { addDateRange, readReportFilters, REPORTS } from "@/lib/reports";
import type { CabinClass, RouteRevenueRow } from "@/lib/types";

const DEFAULT_MIN_TICKETS = 5;
const cell = "py-2 pr-4";

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
  const filters = readReportFilters(await searchParams);
  const typedMinimum = Number(filters.minTickets);
  const minTickets = Number.isInteger(typedMinimum) && typedMinimum >= 1 ? typedMinimum : DEFAULT_MIN_TICKETS;

  const where = ["bs.booking_status_name = 'CONFIRMED'", "fs.flight_status_name <> 'CANCELLED'"];
  const values: (string | number)[] = [];
  addDateRange(where, values, "f.departure_time", filters);
  if (filters.cabin) {
    where.push("cc.cabin_class_name = ?");
    values.push(filters.cabin);
  }

  const [cabins] = await db.query<CabinClass[]>("SELECT * FROM cabin_class ORDER BY cabin_class_id");
  const [rows] = await db.query<RouteRevenueRow[]>(
    `SELECT CONCAT(o.airport_code, ' → ', d.airport_code) AS route, f.distance,
            COUNT(DISTINCT f.flight_id) AS flights, COUNT(*) AS tickets,
            SUM(t.flight_fare) AS revenue, SUM(f.distance) AS passenger_miles,
            ROUND(SUM(t.flight_fare) / SUM(f.distance) * 100, 2) AS revenue_per_100_miles
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN flight_status fs  ON fs.flight_status_id = f.flight_status_id
       JOIN airport o        ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
       JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id
      WHERE ${where.join(" AND ")}
      GROUP BY o.airport_code, d.airport_code, f.distance
      ORDER BY revenue_per_100_miles DESC`,
    values,
  );
  const ranked = rows.filter((row) => row.tickets >= minTickets);
  const tickets = (count: number) => `${count} ticket${count === 1 ? "" : "s"}`;

  return (
    <>
      <ReportFilterForm
        action={REPORTS.revenue.href}
        filters={filters}
        cabins={cabins.map(({ cabin_class_name: name }) => ({ value: name, label: name.charAt(0) + name.slice(1).toLowerCase() }))}
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
            <RouteTable rows={ranked} />
          </>
        )}
      </AdminTile>
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
