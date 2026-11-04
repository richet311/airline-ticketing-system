"use server";

import { revalidatePath } from "next/cache";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { MAX_ROWS, MIN_ROWS, SEATS_PER_ROW } from "@/lib/planeRows";
import { withTransaction } from "@/lib/transaction";
import type { AdminFormState } from "@/lib/types";

import { getSignedInAdmin } from "../requireAdmin";

export type AircraftDeleteResult = { ok: true } | { ok: false; error: string };

class DeleteError extends Error {}

export async function addAircraft(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const values = {
    aircraft_number: String(formData.get("aircraft_number") ?? "").trim().toUpperCase(),
    aircraft_type: String(formData.get("aircraft_type") ?? "").trim(),
    rows: String(formData.get("rows") ?? "").trim(),
    status: String(formData.get("status") ?? ""),
  };
  const fail = (error: string): AdminFormState => ({ error, values });

  const admin = await getSignedInAdmin();
  if (!admin) return fail("Only a System Administrator can add aircraft.");

  if (values.aircraft_number === "" || values.aircraft_number.length > 10) return fail("Number: 1 to 10 characters.");
  if (values.aircraft_type === "" || values.aircraft_type.length > 50) return fail("Type: 1 to 50 characters.");
  const rows = Number(values.rows);
  if (!Number.isInteger(rows) || rows < MIN_ROWS || rows > MAX_ROWS) return fail(`Rows: ${MIN_ROWS} to ${MAX_ROWS}.`);

  try {
    await db.query(
      `INSERT INTO aircraft (aircraft_number, aircraft_type, capacity, maintenance_status_id,
                             created_by, created_at, updated_by, last_updated)
       VALUES (?, ?, ?, (SELECT maintenance_status_id FROM maintenance_status WHERE maintenance_status_name = ?),
               ?, NOW(), ?, NOW())`,
      [values.aircraft_number, values.aircraft_type, rows * SEATS_PER_ROW, values.status, admin.user_id, admin.user_id],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return fail(`Aircraft ${values.aircraft_number} already exists.`);
    if ((error as { code?: string }).code === "ER_BAD_NULL_ERROR") return fail("Choose a status.");
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}

export async function deleteAircraft(aircraftId: number): Promise<AircraftDeleteResult> {
  const admin = await getSignedInAdmin();
  if (!admin) return { ok: false, error: "Only a System Administrator can delete aircraft." };

  try {
    await withTransaction(async (conn) => {
      const [planes] = await conn.query<RowDataPacket[]>(
        "SELECT aircraft_number, capacity FROM aircraft WHERE aircraft_id = ? FOR UPDATE",
        [aircraftId],
      );
      if (planes.length === 0) throw new DeleteError("That aircraft was already deleted.");
      const plane = planes[0];

      const [flights] = await conn.query<RowDataPacket[]>(
        `SELECT flight_id, flight_number, departure_time, arrival_time
           FROM flight
          WHERE aircraft_id = ?
          ORDER BY departure_time
            FOR UPDATE`,
        [aircraftId],
      );
      for (const flight of flights) {
        const [spares] = await conn.query<RowDataPacket[]>(
          `SELECT a.aircraft_id
             FROM aircraft a
             JOIN maintenance_status m ON m.maintenance_status_id = a.maintenance_status_id
            WHERE a.aircraft_id <> ?
              AND a.capacity = ?
              AND m.maintenance_status_name = 'OPERATIONAL'
              AND NOT EXISTS (SELECT 1 FROM flight f
                               WHERE f.aircraft_id = a.aircraft_id
                                 AND f.departure_time < ?
                                 AND f.arrival_time > ?)
            ORDER BY a.aircraft_number
            LIMIT 1`,
          [aircraftId, plane.capacity, flight.arrival_time, flight.departure_time],
        );
        if (spares.length === 0) {
          throw new DeleteError(
            `No operational ${plane.capacity}-seat aircraft is free to take over ${flight.flight_number} on ${formatDate(flight.departure_time)}. Add one first.`,
          );
        }
        await conn.query("UPDATE flight SET aircraft_id = ?, updated_by = ?, last_updated = NOW() WHERE flight_id = ?", [
          spares[0].aircraft_id,
          admin.user_id,
          flight.flight_id,
        ]);
      }

      await conn.query("DELETE FROM aircraft WHERE aircraft_id = ?", [aircraftId]);
    });
  } catch (error) {
    if (error instanceof DeleteError) return { ok: false, error: error.message };
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}
