import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { DEFAULT_MIN_TICKETS, STATUS_GROUPS, statusGroup } from "@/lib/reports";

import { MiniBarChart, MiniPieChart } from "./Charts";

const PREVIEW_COUNT = 5;

const empty = <p className="text-xs text-gray-500">No data yet.</p>;

export async function RevenuePreview() {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT CONCAT(o.airport_code, ' → ', d.airport_code) AS route, SUM(t.flight_fare) / SUM(f.distance) AS per_mile
       FROM ticket t
       JOIN booking b         ON b.booking_id = t.booking_id
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN flight f          ON f.flight_id = t.flight_id
       JOIN flight_status fs  ON fs.flight_status_id = f.flight_status_id
       JOIN airport o         ON o.airport_id = f.origin_airport_id
       JOIN airport d         ON d.airport_id = f.destination_airport_id
      WHERE bs.booking_status_name = 'CONFIRMED' AND fs.flight_status_name <> 'CANCELLED'
      GROUP BY o.airport_code, d.airport_code, f.distance
     HAVING COUNT(*) >= ?
      ORDER BY per_mile DESC
      LIMIT ?`,
    [DEFAULT_MIN_TICKETS, PREVIEW_COUNT],
  );
  if (rows.length === 0) return empty;
  return <MiniBarChart data={rows.map((row) => ({ label: row.route as string, value: Number(row.per_mile) }))} />;
}

export async function OperationsPreview() {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT fs.flight_status_name AS status, COUNT(*) AS flights
       FROM flight f
       JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
      GROUP BY fs.flight_status_name`,
  );
  const slices = STATUS_GROUPS.map((group) => ({
    label: group,
    value: rows.filter((row) => statusGroup(row.status as string) === group).reduce((sum, row) => sum + Number(row.flights), 0),
  })).filter((slice) => slice.value > 0);
  if (slices.length === 0) return empty;
  return <MiniPieChart data={slices} />;
}

export async function CustomersPreview() {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT p.first_name, p.last_name,
            SUM(CASE WHEN bs.booking_status_name = 'CONFIRMED' AND cf.booking_id IS NULL THEN b.total_amount ELSE 0 END) AS spend
       FROM booking b
       JOIN booking_status bs ON bs.booking_status_id = b.booking_status_id
       JOIN passenger p       ON p.passenger_id = b.passenger_id
       LEFT JOIN (SELECT DISTINCT t.booking_id
                    FROM ticket t
                    JOIN flight f         ON f.flight_id = t.flight_id
                    JOIN flight_status fs ON fs.flight_status_id = f.flight_status_id
                   WHERE fs.flight_status_name = 'CANCELLED') cf ON cf.booking_id = b.booking_id
      GROUP BY p.passenger_id, p.first_name, p.last_name
     HAVING spend > 0
      ORDER BY spend DESC
      LIMIT ?`,
    [PREVIEW_COUNT],
  );
  if (rows.length === 0) return empty;
  return (
    <MiniBarChart
      data={rows.map((row) => {
        const first = String(row.first_name ?? "");
        const last = String(row.last_name ?? "");
        return { label: `${first.charAt(0)}${first.slice(1).toLowerCase()}${last ? ` ${last.charAt(0)}.` : ""}`, value: Number(row.spend) };
      })}
    />
  );
}
