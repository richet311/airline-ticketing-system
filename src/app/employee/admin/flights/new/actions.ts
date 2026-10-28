"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";
import { SEATS_PER_ROW } from "@/lib/planeRows";
import { withTransaction } from "@/lib/transaction";
import type { AdminFormState } from "@/lib/types";

import { getSignedInAdmin } from "../../requireAdmin";

//order in which the cabins appear in seat selector
const CABINS = [
  { name: "FIRST", field: "first", changeFee: 300 },
  { name: "BUSINESS", field: "business", changeFee: 150 },
  { name: "PREMIUM", field: "premium", changeFee: 100 },
  { name: "ECONOMY", field: "economy", changeFee: 50 },
];

const MAX_FLIGHT_MINUTES = 24 * 60;

//schedule flight form for sys admins and operations managers
export async function scheduleFlight(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) values[key] = String(value).trim();
  const fail = (error: string): AdminFormState => ({ error, values });

  const admin = await getSignedInAdmin();
  if (!admin) return fail("Only a System Administrator can schedule flights.");

  const flightNumber = (values.flight_number ?? "").toUpperCase().replace(/\s/g, "");
  const departure = toDatabaseTime(values.departure_date, values.departure_time);
  const arrival = toDatabaseTime(values.arrival_date, values.arrival_time);
  const distance = Number(values.distance);

  if (flightNumber === "" || flightNumber.length > 10) return fail("Flight number is at most 10 characters, like AZ500.");
  if (!values.origin || !values.destination) return fail("Choose both airports.");
  if (values.origin === values.destination) return fail("From and To must be different airports.");
  if (!departure || !arrival) return fail("Enter the departure and arrival dates and times.");
  const durationMinutes = (Date.parse(`${arrival.replace(" ", "T")}Z`) - Date.parse(`${departure.replace(" ", "T")}Z`)) / 60000;
  if (durationMinutes <= 0) return fail("Arrival must be after departure.");
  if (durationMinutes > MAX_FLIGHT_MINUTES) return fail("A flight can't be longer than 24 hours. Check the dates.");
  if (!Number.isInteger(distance) || distance <= 0) return fail("Distance is in miles and is greater than 0.");

  const cabins = CABINS.map((cabin) => ({
    ...cabin,
    rows: Number(values[`${cabin.field}_rows`] || 0),
    price: Number(values[`${cabin.field}_price`] || 0),
  }));
  for (const cabin of cabins) {
    if (!Number.isInteger(cabin.rows) || cabin.rows < 0) return fail(`${cabin.name} rows must be a whole number.`);
    if (cabin.rows > 0 && !(cabin.price > 0)) return fail(`Enter a price for ${cabin.name}.`);
  }
  const offered = cabins.filter((cabin) => cabin.rows > 0);
  if (offered.length === 0) return fail("Offer at least one cabin.");

  // The aircraft has to be OPERATIONAL and all seats should be assigned to a specific cabin.
  const [aircraft] = await db.query<RowDataPacket[]>(
    `SELECT a.aircraft_id, a.capacity
       FROM aircraft a
       JOIN maintenance_status m ON m.maintenance_status_id = a.maintenance_status_id
      WHERE a.aircraft_number = ? AND m.maintenance_status_name = 'OPERATIONAL'`,
    [values.aircraft],
  );
  if (aircraft.length === 0) return fail("Choose an operational aircraft.");
  const planeRows = aircraft[0].capacity / SEATS_PER_ROW;
  const rowTotal = offered.reduce((sum, cabin) => sum + cabin.rows, 0);
  if (rowTotal !== planeRows) {
    return fail(`The cabins add up to ${rowTotal} rows, but ${values.aircraft} has ${planeRows}.`);
  }

  try {
    await withTransaction(async (conn) => {
      const [flight] = await conn.query<ResultSetHeader>(
        `INSERT INTO flight (flight_number, aircraft_id, origin_airport_id, destination_airport_id,
                             departure_time, arrival_time, departure_gate_id, arrival_gate_id,
                             flight_status_id, distance, created_by, created_at, updated_by, last_updated)
         VALUES (?, ?, (SELECT airport_id FROM airport WHERE airport_code = ?),
                 (SELECT airport_id FROM airport WHERE airport_code = ?), ?, ?, NULL, NULL,
                 (SELECT flight_status_id FROM flight_status WHERE flight_status_name = 'SCHEDULED'),
                 ?, ?, NOW(), ?, NOW())`,
        [flightNumber, aircraft[0].aircraft_id, values.origin, values.destination, departure, arrival, distance, admin.user_id, admin.user_id],
      );
      const flightId = flight.insertId;

      let firstRow = 1;
      for (const cabin of offered) {
        const seats = cabin.rows * SEATS_PER_ROW;
        const lastRow = firstRow + cabin.rows - 1;
        await conn.query(
          `INSERT INTO fare_class (flight_id, cabin_class_id, base_price, seats_total, seats_available,
                                   is_refundable, change_fee, created_by, created_at, updated_by, last_updated)
           VALUES (?, (SELECT cabin_class_id FROM cabin_class WHERE cabin_class_name = ?), ?, ?, ?, 1, ?, ?, NOW(), ?, NOW())`,
          [flightId, cabin.name, cabin.price, seats, seats, cabin.changeFee, admin.user_id, admin.user_id],
        );
        await conn.query(
          `INSERT INTO seat (flight_id, seat_number, cabin_class_id, seat_status_id, held_until,
                             created_by, created_at, updated_by, last_updated)
           WITH RECURSIVE seat_row (n) AS (
               SELECT ? UNION ALL SELECT n + 1 FROM seat_row WHERE n < ?
           ),
           letter (l) AS (
               SELECT 'A' UNION ALL SELECT 'B' UNION ALL SELECT 'C' UNION ALL SELECT 'D' UNION ALL SELECT 'E' UNION ALL SELECT 'F'
           )
           SELECT ?, CONCAT(seat_row.n, letter.l), (SELECT cabin_class_id FROM cabin_class WHERE cabin_class_name = ?),
                  (SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'AVAILABLE'), NULL,
                  ?, NOW(), ?, NOW()
             FROM seat_row CROSS JOIN letter`,
          [firstRow, lastRow, flightId, cabin.name, admin.user_id, admin.user_id],
        );
        firstRow = lastRow + 1;
      }
    });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return fail(`${flightNumber} already departs at that time.`);
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}

function toDatabaseTime(date: string | undefined, time: string | undefined): string | null {
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return Number.isNaN(Date.parse(`${date}T${time}:00Z`)) ? null : `${date} ${time}:00`;
}
