"use server";

import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { checkPassword, startSession } from "@/lib/session";

// which job_role_ids go to which dashboard (other roles can't sign in)
const ADMIN_ROLES = [91, 92]; // System Administrator, Operations Manager
const AGENT_ROLES = [95, 96, 97]; // Customer Service Agent, Gate Agent, Tarmac Agent

// same message either way, so it doesn't reveal which staff accounts exist
const WRONG_STAFF_LOGIN = "That employee ID or email and password don't match a staff account.";

export type StaffSignInState = { error: string; identifier: string } | null;

export async function staffSignIn(previousState: StaffSignInState, formData: FormData): Promise<StaffSignInState> {
  // all digits = employee ID, anything else = email
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const byEmployeeId = /^\d+$/.test(identifier);

  const [staff] = await db.query<RowDataPacket[]>(
    `SELECT u.user_id, u.password_hash, e.job_role_id, e.is_active
       FROM employee e
       JOIN user u ON u.user_id = e.user_id
      WHERE ${byEmployeeId ? "e.employee_id = ?" : "u.email = ?"}`,
    [byEmployeeId ? Number(identifier) : identifier],
  );

  if (staff.length === 0 || !(await checkPassword(password, staff[0].password_hash))) {
    return { error: WRONG_STAFF_LOGIN, identifier };
  }
  const { user_id: userId, job_role_id: role, is_active: isActive } = staff[0];
  if (isActive !== 1) {
    return { error: "This staff account is inactive. Contact your administrator.", identifier };
  }
  const dashboard = ADMIN_ROLES.includes(role) ? "/employee/admin" : AGENT_ROLES.includes(role) ? "/employee/agent" : null;
  if (!dashboard) {
    return { error: "Your role doesn't have a portal dashboard yet.", identifier };
  }

  // staff sessions end when the browser closes (shared computers)
  await startSession(userId, false);
  redirect(dashboard);
}
