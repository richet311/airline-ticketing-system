"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { AdminFormState } from "@/lib/types";

import { getSignedInAdmin } from "../requireAdmin";

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
  if (!/^[A-Z]{3}$/.test(values.airport_code)) return fail("Code: 3 letters, like IAH.");
  if (values.airport_name === "" || values.airport_name.length > 100) return fail("Name: 1 to 100 characters.");
  if (values.city === "" || values.city.length > 50) return fail("City: 1 to 50 characters.");
  if (!/^[A-Z]{2}$/.test(values.country)) return fail("Country: 2 letters, like US.");
  if (!isTimeZone(values.timezone)) return fail("Time zone: a name like America/Chicago.");

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

function isTimeZone(zone: string): boolean {
  if (zone === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
