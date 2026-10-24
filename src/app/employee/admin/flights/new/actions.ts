"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";
import { withTransaction } from "@/lib/transaction";
import type { AdminFormState } from "@/lib/types";

import { getSignedInAdmin } from "../../requireAdmin";

// Front of the plane to the back, with each cabin's change fee (the seed's rule, also shown
// under the search results).
const CABINS = [
  { name: "FIRST", field: "first", changeFee: 300 },
  { name: "BUSINESS", field: "business", changeFee: 150 },
  { name: "PREMIUM", field: "premium", changeFee: 100 },
  { name: "ECONOMY", field: "economy", changeFee: 50 },
];

// Schedule flight form on /employee/admin. Saves, in one transaction:
// - the flight (SCHEDULED, no gates yet)
// - one fare_class per cabin offered (refundable, the cabin's change fee)
// - its seats, rows of 2: First from row 1, then Business, Premium, Economy
// Times are typed in UTC, like everything stored in the database.
export async function scheduleFlight(_previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) values[key] = String(value).trim();
  const fail = (error: string): AdminFormState => ({ error, values });

  const admin = await getSignedInAdmin();
  if (!admin) return fail("Only a System Administrator can schedule flights.");

  const flightNumber = (values.flight_number ?? "").toUpperCase().replace(/\s/g, "");
  // "2026-11-20T14:30" (datetime-local) -> "2026-11-20 14:30:00"
  const departure = toDatabaseTime(values.departure);
  const arrival = toDatabaseTime(values.arrival);
  const distance = Number(values.distance);

  if (flightNumber === "" || flightNumber.length > 10) return fail("Flight number: 1 to 10 characters, like AZ500.");
  if (!values.origin || !values.destination) return fail("Choose both airports.");
  if (values.origin === values.destination) return fail("From and To must be different airports.");
  if (!departure || !arrival) return fail("Enter departure and arrival times.");
  if (arrival <= departure) return fail("Arrival must be after departure.");
  if (!Number.isInteger(distance) || distance <= 0) return fail("Distance: a whole number of miles above 0.");

  // seats and price for each cabin; 0 seats = not offered
  const cabins = CABINS.map((cabin) => ({
    ...cabin,
    seats: Number(values[`${cabin.field}_seats`] || 0),
    price: Number(values[`${cabin.field}_price`] || 0),
  }));
  for (const cabin of cabins) {
    if (!Number.isInteger(cabin.seats) || cabin.seats < 0 || cabin.seats % 2 !== 0) {
      return fail(`${cabin.name} seats must be an even number (rows of 2).`);
    }
    if (cabin.seats > 0 && !(cabin.price > 0)) return fail(`Enter a price for ${cabin.name}.`);
  }
  const offered = cabins.filter((cabin) => cabin.seats > 0);
  if (offered.length === 0) return fail("Offer at least one cabin.");

  // The aircraft must be OPERATIONAL, and its seats must all be given a cabin.
  const [aircraft] = await db.query<RowDataPacket[]>(
    `SELECT a.aircraft_id, a.capacity
       FROM aircraft a
       JOIN maintenance_status m ON m.maintenance_status_id = a.maintenance_status_id
      WHERE a.aircraft_number = ? AND m.maintenance_status_name = 'OPERATIONAL'`,
    [values.aircraft],
  );
  if (aircraft.length === 0) return fail("Choose an operational aircraft.");
  const seatTotal = offered.reduce((sum, cabin) => sum + cabin.seats, 0);
  if (seatTotal !== aircraft[0].capacity) {
    return fail(`The cabins add up to ${seatTotal} seats, but ${values.aircraft} has ${aircraft[0].capacity}.`);
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

      let row = 1;
      for (const cabin of offered) {
        await conn.query(
          `INSERT INTO fare_class (flight_id, cabin_class_id, base_price, seats_total, seats_available,
                                   is_refundable, change_fee, created_by, created_at, updated_by, last_updated)
           VALUES (?, (SELECT cabin_class_id FROM cabin_class WHERE cabin_class_name = ?), ?, ?, ?, 1, ?, ?, NOW(), ?, NOW())`,
          [flightId, cabin.name, cabin.price, cabin.seats, cabin.seats, cabin.changeFee, admin.user_id, admin.user_id],
        );
        // this cabin's rows, continuing from the cabin in front: 1A, 1B, 2A, 2B, ...
        for (let i = 0; i < cabin.seats / 2; i++, row++) {
          for (const letter of ["A", "B"]) {
            await conn.query(
              `INSERT INTO seat (flight_id, seat_number, cabin_class_id, seat_status_id, held_until,
                                 created_by, created_at, updated_by, last_updated)
               VALUES (?, ?, (SELECT cabin_class_id FROM cabin_class WHERE cabin_class_name = ?),
                       (SELECT seat_status_id FROM seat_status WHERE seat_status_name = 'AVAILABLE'), NULL,
                       ?, NOW(), ?, NOW())`,
              [flightId, `${row}${letter}`, cabin.name, admin.user_id, admin.user_id],
            );
          }
        }
      }
    });
  } catch (error) {
    // unique_flight_number_departure
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return fail(`${flightNumber} already departs at that time.`);
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}

// "2026-11-20T14:30" -> "2026-11-20 14:30:00"; null if it isn't that shape
function toDatabaseTime(value: string | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value.replace("T", " ")}:00` : null;
}
