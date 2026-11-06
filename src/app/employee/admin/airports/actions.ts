"use server";

import { revalidatePath } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { withTransaction } from "@/lib/transaction";
import type { AdminFormState } from "@/lib/types";

import { getSignedInAdmin } from "../requireAdmin";

export type AirportUpdateResult = { ok: true } | { ok: false; error: string };

class AirportError extends Error {}

export async function addAirport(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const values = {
    airport_code: String(formData.get("airport_code") ?? "").trim().toUpperCase(),
    airport_name: String(formData.get("airport_name") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim().toUpperCase(),
    timezone: String(formData.get("timezone") ?? "").trim(),
  };
  const fail = (error: string): AdminFormState => ({ error, values });

  const admin = await getSignedInAdmin();
  if (!admin) return fail("Only a System Administrator can add airports.");

  // validation from our schema reiterated
  const problem = airportProblem(values);
  if (problem) return fail(problem);

  try {
    await db.query(
      `INSERT INTO airport (airport_code, airport_name, city, country, timezone,
                            created_by, created_at, updated_by, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      [values.airport_code, values.airport_name, values.city, values.country, values.timezone, admin.user_id, admin.user_id],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return fail(`Airport ${values.airport_code} already exists.`);
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}

export async function updateAirport(input: {
  airportId: number;
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}): Promise<AirportUpdateResult> {
  const admin = await getSignedInAdmin();
  if (!admin) return { ok: false, error: "Only a System Administrator can edit airports." };

  const values = {
    airport_code: input.code.trim().toUpperCase(),
    airport_name: input.name.trim(),
    city: input.city.trim(),
    country: input.country.trim().toUpperCase(),
    timezone: input.timezone.trim(),
  };
  const problem = airportProblem(values);
  if (problem) return { ok: false, error: problem };

  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE airport
          SET airport_code = ?, airport_name = ?, city = ?, country = ?, timezone = ?, updated_by = ?, last_updated = NOW()
        WHERE airport_id = ?`,
      [values.airport_code, values.airport_name, values.city, values.country, values.timezone, admin.user_id, input.airportId],
    );
    if (result.affectedRows === 0) return { ok: false, error: "That airport no longer exists." };
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return { ok: false, error: `Another airport already uses ${values.airport_code}.` };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// Removes an airport no flight uses, along with its terminals and gates
export async function deleteAirport(airportId: number): Promise<AirportUpdateResult> {
  const admin = await getSignedInAdmin();
  if (!admin) return { ok: false, error: "Only a System Administrator can remove airports." };

  try {
    await withTransaction(async (conn) => {
      const [airports] = await conn.query<RowDataPacket[]>("SELECT airport_code FROM airport WHERE airport_id = ? FOR UPDATE", [
        airportId,
      ]);
      if (airports.length === 0) throw new AirportError("That airport was already removed.");
      const code = airports[0].airport_code;

      const [flights] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS flights FROM flight WHERE origin_airport_id = ? OR destination_airport_id = ?",
        [airportId, airportId],
      );
      if (Number(flights[0].flights) > 0) {
        throw new AirportError(`${code} has flights, so it can't be removed. Edit its details instead.`);
      }
      const [staff] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS staff
           FROM employee e
           JOIN gate g     ON g.gate_id = e.assigned_gate_id
           JOIN terminal t ON t.terminal_id = g.terminal_id
          WHERE t.airport_id = ?`,
        [airportId],
      );
      if (Number(staff[0].staff) > 0) {
        throw new AirportError(`Staff are assigned to gates at ${code}. Move them to another gate first.`);
      }

      await conn.query(
        "DELETE g FROM gate g JOIN terminal t ON t.terminal_id = g.terminal_id WHERE t.airport_id = ?",
        [airportId],
      );
      await conn.query("DELETE FROM terminal WHERE airport_id = ?", [airportId]);
      await conn.query("DELETE FROM airport WHERE airport_id = ?", [airportId]);
    });
  } catch (error) {
    if (error instanceof AirportError) return { ok: false, error: error.message };
    throw error;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// the same rules as the airport table's checks, with friendlier messages
function airportProblem(values: { airport_code: string; airport_name: string; city: string; country: string; timezone: string }) {
  if (!/^[A-Z]{3}$/.test(values.airport_code)) return "Code: 3 letters, like IAH.";
  if (values.airport_name === "" || values.airport_name.length > 100) return "Name: 1 to 100 characters.";
  if (values.city === "" || values.city.length > 50) return "City: 1 to 50 characters.";
  if (!/^[A-Z]{2}$/.test(values.country)) return "Country: 2 letters, like US.";
  if (!isTimeZone(values.timezone)) return "Time zone: a name like America/Chicago.";
  return null;
}

function isTimeZone(zone: string): boolean {
  if (zone === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
