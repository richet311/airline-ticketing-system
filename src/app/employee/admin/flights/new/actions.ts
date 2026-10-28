"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";
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

  // The aircraft has to be OPERATIONAL and all seats should be assigned to a specific cabin.
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
