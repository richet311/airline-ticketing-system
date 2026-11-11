import type { RowDataPacket } from "mysql2";
import { Suspense } from "react";

import { AdminTable, AdminTile } from "@/components/admin/AdminTile";
import { pageNumber, TilePager } from "@/components/admin/TilePager";
import { BarChart } from "@/components/reports/Charts";
import { ReportFilterForm } from "@/components/reports/ReportFilterForm";
import { ReportShell } from "@/components/reports/ReportShell";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { addDateRange, readReportFilters, REPORT_TABLE_SIZE, REPORTS } from "@/lib/reports";
import { getTiers, tierFor, tierLabel } from "@/lib/rewards";
import type { CustomerBookingRow, CustomerValueRow } from "@/lib/types";

const CANCELLED_FLIGHT_BOOKINGS = `(SELECT DISTINCT t.booking_id
                    FROM ticket t
                    JOIN flight f         ON f.flight_id = t.flight_id
                    JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
                   WHERE fs.flight_status_name = 'CANCELLED')`;
const NO_ACCOUNT = "NONE";
const CHART_COUNT = 10;
const cell = "py-2 pr-4";

export default function CustomersReportPage({ searchParams }: PageProps<"/employee/admin/reports/customers">) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <ReportShell report={REPORTS.customers}>
        <CustomersReport searchParams={searchParams} />
      </ReportShell>
    </Suspense>
  );
}

async function CustomersReport({
  searchParams,
}: {
  searchParams: PageProps<"/employee/admin/reports/customers">["searchParams"];
}) {
  const params = await searchParams;
  const filters = readReportFilters(params);

  const where: string[] = [];
  const values: (string | number)[] = [];
  addDateRange(where, values, "b.created_at", filters);

  const [rows] = await db.query<CustomerValueRow[]>(
    `SELECT p.passenger_id, p.first_name, p.last_name, u.user_id, u.email, u.loyalty_points,
            COUNT(*) AS bookings,
            COUNT(CASE WHEN bs.booking_status_name = 'CANCELLED' THEN 1 END) AS cancelled,
            COALESCE(SUM(CASE WHEN bs.booking_status_name = 'CONFIRMED' AND cf.booking_id IS NULL THEN b.total_amount END), 0) AS spend
       FROM booking b
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN passenger p       ON p.passenger_id = b.passenger_id
       LEFT JOIN user u       ON u.user_id = p.user_id
       LEFT JOIN ${CANCELLED_FLIGHT_BOOKINGS} cf ON cf.booking_id = b.booking_id
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY p.passenger_id, p.first_name, p.last_name, u.user_id, u.email, u.loyalty_points
      ORDER BY spend DESC`,
    values,
  );
  const [bookingRows] = await db.query<CustomerBookingRow[]>(
    `SELECT b.booking_id, b.passenger_id, b.created_at, bs.booking_status_name, b.total_amount,
            cf.booking_id IS NOT NULL AS on_cancelled_flight,
            (SELECT GROUP_CONCAT(DISTINCT f.flight_number ORDER BY f.flight_number SEPARATOR ', ')
               FROM ticket t
               JOIN flight f ON f.flight_id = t.flight_id
              WHERE t.booking_id = b.booking_id) AS flights
       FROM booking b
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       LEFT JOIN ${CANCELLED_FLIGHT_BOOKINGS} cf ON cf.booking_id = b.booking_id
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY b.created_at, b.booking_id`,
    values,
  );
  const [yearSpend] = await db.query<RowDataPacket[]>(
    `SELECT user_id, SUM(qualifying_spend) AS spend
       FROM points_transaction
      WHERE created_at >= NOW() - INTERVAL 12 MONTH
      GROUP BY user_id`,
  );
  const tiers = await getTiers();

  const customers = rows
    .map((row) => {
      const spend = Number(yearSpend.find((year) => year.user_id === row.user_id)?.spend ?? 0);
      const tier = row.user_id === null ? NO_ACCOUNT : tierFor(Math.max(0, spend), tiers).tier_name;
      const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Unnamed";
      return { ...row, name, tier };
    })
    .filter((customer) => filters.tier === "" || customer.tier === filters.tier);
  const page = pageNumber(params, "page", customers.length, REPORT_TABLE_SIZE);
  const topSpenders = customers
    .filter((customer) => customer.spend > 0)
    .slice(0, CHART_COUNT)
    .map((customer) => ({ label: customer.name, value: customer.spend }));
  const tierName = (tier: string) => (tier === NO_ACCOUNT ? "No account" : tierLabel(tier));

  const customerOrder = new Map(customers.map((customer, index) => [customer.passenger_id, index]));
  const customerName = new Map(customers.map((customer) => [customer.passenger_id, customer.name]));
  const customerBookings = bookingRows
    .filter((booking) => customerOrder.has(booking.passenger_id))
    .sort((a, b) => (customerOrder.get(a.passenger_id) ?? 0) - (customerOrder.get(b.passenger_id) ?? 0));
  const bookingPage = pageNumber(params, "detail_page", customerBookings.length, REPORT_TABLE_SIZE);
  const spendNote = (booking: CustomerBookingRow) => {
    if (booking.booking_status_name === "CANCELLED") return "No · booking cancelled";
    if (booking.booking_status_name !== "CONFIRMED") return "No · not paid yet";
    if (booking.on_cancelled_flight === 1) return "No · flight cancelled";
    return "Yes";
  };

  return (
    <>
      <ReportFilterForm
        action={REPORTS.customers.href}
        filters={filters}
        tiers={[
          ...tiers.map((tier) => ({ value: tier.tier_name, label: tierName(tier.tier_name) })),
          { value: NO_ACCOUNT, label: tierName(NO_ACCOUNT) },
        ]}
      />

      {customers.length === 0 ? (
        <p className="rounded-card border border-gray-200 bg-white p-6 text-gray-600">No customers match these filters.</p>
      ) : (
        <>
          <AdminTile overline="Customers" title="Spend on confirmed bookings">
            <p className="mb-4 text-sm text-gray-600">
              Lifetime total spend per customer. Tier comes from a customer&apos;s qualifying spend over the past 12 months.
            </p>
            {topSpenders.length > 0 && <BarChart data={topSpenders} format={formatMoney} />}
            <AdminTable headings={["Customer", "Email", "Rewards tier", "Bookings", "Cancelled", "Spend", "Points balance"]}>
              {customers.slice((page - 1) * REPORT_TABLE_SIZE, page * REPORT_TABLE_SIZE).map((customer) => (
                <tr key={customer.passenger_id}>
                  <td className={`${cell} font-semibold`}>{customer.name}</td>
                  <td className={cell}>{customer.email ?? "—"}</td>
                  <td className={cell}>{tierName(customer.tier)}</td>
                  <td className={cell}>{customer.bookings}</td>
                  <td className={cell}>{customer.cancelled}</td>
                  <td className={cell}>{formatMoney(customer.spend)}</td>
                  <td className={cell}>{customer.loyalty_points?.toLocaleString("en-US") ?? "—"}</td>
                </tr>
              ))}
            </AdminTable>
            <TilePager
              basePath={REPORTS.customers.href}
              params={params}
              name="page"
              page={page}
              size={REPORT_TABLE_SIZE}
              total={customers.length}
              noun="Customers"
            />
          </AdminTile>

          <AdminTile overline="Detail" title="Bookings by customer">
            <p className="mb-4 text-sm text-gray-600">
              Every booking behind the customers above, in the order in which they appear.
            </p>
            <AdminTable headings={["Customer", "Booking", "Booked (UTC)", "Flights", "Status", "Total", "Counted in spend"]}>
              {customerBookings.slice((bookingPage - 1) * REPORT_TABLE_SIZE, bookingPage * REPORT_TABLE_SIZE).map((booking) => (
                <tr key={booking.booking_id}>
                  <td className={`${cell} font-semibold`}>{customerName.get(booking.passenger_id)}</td>
                  <td className={cell}>{booking.booking_id}</td>
                  <td className={cell}>{formatDate(booking.created_at)}</td>
                  <td className={cell}>{booking.flights ?? "—"}</td>
                  <td className={cell}>
                    {booking.booking_status_name.charAt(0) + booking.booking_status_name.slice(1).toLowerCase()}
                  </td>
                  <td className={cell}>{formatMoney(booking.total_amount)}</td>
                  <td className={cell}>{spendNote(booking)}</td>
                </tr>
              ))}
            </AdminTable>
            <TilePager
              basePath={REPORTS.customers.href}
              params={params}
              name="detail_page"
              page={bookingPage}
              size={REPORT_TABLE_SIZE}
              total={customerBookings.length}
              noun="Bookings"
            />
          </AdminTile>
        </>
      )}
    </>
  );
}
