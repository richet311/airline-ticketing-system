import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { EmployeeHeader } from "@/components/employee/EmployeeHeader";
import { BarChart, LineChart, PieChart } from "@/components/reports/Charts";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { canUse, OPERATIONS_MANAGER } from "@/lib/roles";
import { getSignedInEmployee } from "@/lib/session";
import type { CabinRevenueRow, DailyRevenueRow, RouteRevenueRow } from "@/lib/types";

const cell = "py-2 pr-4";

export default function ReportsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <Reports />
    </Suspense>
  );
}

async function Reports() {
  await connection();
  const employee = await getSignedInEmployee();
  if (!employee) redirect("/login/employee");
  const allowed = canUse(employee.job_role_name, [OPERATIONS_MANAGER]);

  return (
    <>
      <EmployeeHeader employee={employee} />
      <main className="flex-1 bg-azure-page">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          <h1 className="text-3xl font-semibold text-azure-navy">Reports</h1>
          {allowed ? (
            <>
              <RouteReport />
              <CabinReport />
              <DailyRevenueReport />
            </>
          ) : (
            <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600">
              Reports are only available to System Administrators and Operations Managers.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

async function RouteReport() {
  const [rows] = await db.query<RouteRevenueRow[]>(
    `SELECT CONCAT(o.airport_code, ' → ', d.airport_code) AS route, f.distance,
            COUNT(DISTINCT f.flight_id) AS flights, COUNT(*) AS tickets,
            SUM(t.flight_fare) AS revenue, SUM(f.distance) AS passenger_miles,
            ROUND(SUM(t.flight_fare) / SUM(f.distance) * 100, 2) AS revenue_per_100_miles
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
      WHERE bs.booking_status_name <> 'CANCELLED'
      GROUP BY o.airport_code, d.airport_code, f.distance
      ORDER BY revenue_per_100_miles DESC`,
  );

  return (
    <AdminTile overline="Report 1" title="Revenue per 100 Miles a Passenger Flies">
      <p className="mb-4 text-sm text-gray-600">
        Total ticket revenue divided by the miles flown by passengers on that route, per every 100 miles. For the sake
        of the report, cancelled bookings have been omitted.
      </p>
      <BarChart data={rows.map((row) => ({ label: row.route, value: row.revenue_per_100_miles }))} format={formatMoney} />
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
    </AdminTile>
  );
}

async function CabinReport() {
  const [rows] = await db.query<CabinRevenueRow[]>(
    `SELECT cc.cabin_class_name AS cabin, COUNT(*) AS tickets, SUM(t.flight_fare) AS revenue,
            ROUND(AVG(t.flight_fare), 2) AS average_fare,
            ROUND(SUM(t.flight_fare) * 100 / SUM(SUM(t.flight_fare)) OVER (), 1) AS revenue_share
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN fare_class fc     ON fc.fare_class_id = t.fare_class_id
       JOIN cabin_class cc    ON cc.cabin_class_id = fc.cabin_class_id
      WHERE bs.booking_status_name <> 'CANCELLED'
      GROUP BY cc.cabin_class_id, cc.cabin_class_name
      ORDER BY cc.cabin_class_id`,
  );

  return (
    <AdminTile overline="Report 2" title="Distribution of Revenue by Cabin Class">
      <p className="mb-4 text-sm text-gray-600">
        Share of total revenue for each cabin class offered. Also captured is the average fare in each class.
      </p>
      <PieChart data={rows.map((row) => ({ label: row.cabin, value: row.revenue }))} format={formatMoney} />
      <AdminTable headings={["Cabin", "Tickets", "Revenue", "Average fare", "Share of revenue"]}>
        {rows.map((row) => (
          <tr key={row.cabin}>
            <td className={`${cell} font-semibold`}>{row.cabin}</td>
            <td className={cell}>{row.tickets}</td>
            <td className={cell}>{formatMoney(row.revenue)}</td>
            <td className={cell}>{formatMoney(row.average_fare)}</td>
            <td className={cell}>{row.revenue_share}%</td>
          </tr>
        ))}
      </AdminTable>
    </AdminTile>
  );
}

async function DailyRevenueReport() {
  const [rows] = await db.query<DailyRevenueRow[]>(
    `SELECT DATE(payment_time) AS day,
            SUM(CASE WHEN payment_status = 'RECEIVED' THEN total_amount ELSE 0 END) AS received,
            SUM(CASE WHEN payment_status = 'REFUNDED' THEN total_amount ELSE 0 END) AS refunded,
            SUM(CASE WHEN payment_status = 'RECEIVED' THEN total_amount ELSE -total_amount END) AS net,
            SUM(SUM(CASE WHEN payment_status = 'RECEIVED' THEN total_amount ELSE -total_amount END))
              OVER (ORDER BY DATE(payment_time)) AS running_total
       FROM payment
      WHERE payment_time IS NOT NULL AND payment_status IN ('RECEIVED', 'REFUNDED')
      GROUP BY DATE(payment_time)
      ORDER BY day`,
  );

  return (
    <AdminTile overline="Report 3" title="Net Revenue To Date">
      <p className="mb-4 text-sm text-gray-600">A running total of revenue minus refunds over time.</p>
      <LineChart data={rows.map((row) => ({ label: formatDate(row.day), value: row.running_total }))} format={formatMoney} />
      <AdminTable headings={["Day", "Received", "Refunded", "Net", "Running total"]}>
        {rows.map((row) => (
          <tr key={row.day}>
            <td className={`${cell} font-semibold`}>{formatDate(row.day)}</td>
            <td className={cell}>{formatMoney(row.received)}</td>
            <td className={cell}>{formatMoney(row.refunded)}</td>
            <td className={`${cell} ${row.net < 0 ? "text-red-700" : ""}`}>{formatMoney(row.net)}</td>
            <td className={cell}>{formatMoney(row.running_total)}</td>
          </tr>
        ))}
      </AdminTable>
    </AdminTile>
  );
}
