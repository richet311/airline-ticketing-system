"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { PLANE_ROWS, SEATS_PER_ROW } from "@/lib/planeRows";
import type { AdminFormState } from "@/lib/types";

import { getSignedInAdmin } from "../requireAdmin";

export async function addAircraft(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const values = {
    aircraft_number: String(formData.get("aircraft_number") ?? "").trim().toUpperCase(),
    aircraft_type: String(formData.get("aircraft_type") ?? "").trim(),
    status: String(formData.get("status") ?? ""),
  };
  const fail = (error: string): AdminFormState => ({ error, values });

  const admin = await getSignedInAdmin();
  if (!admin) return fail("Only a System Administrator can add aircraft.");

  if (values.aircraft_number === "" || values.aircraft_number.length > 10) return fail("Number: 1 to 10 characters.");
  if (values.aircraft_type === "" || values.aircraft_type.length > 50) return fail("Type: 1 to 50 characters.");

  try {
    await db.query(
      `INSERT INTO aircraft (aircraft_number, aircraft_type, capacity, maintenance_status_id,
                             created_by, created_at, updated_by, last_updated)
       VALUES (?, ?, ?, (SELECT maintenance_status_id FROM maintenance_status WHERE maintenance_status_name = ?),
               ?, NOW(), ?, NOW())`,
      [values.aircraft_number, values.aircraft_type, PLANE_ROWS * SEATS_PER_ROW, values.status, admin.user_id, admin.user_id],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return fail(`Aircraft ${values.aircraft_number} already exists.`);
    if ((error as { code?: string }).code === "ER_BAD_NULL_ERROR") return fail("Choose a status.");
    throw error;
  }

  revalidatePath("/employee/admin");
  return { ok: true };
}
