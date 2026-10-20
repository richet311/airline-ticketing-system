"use server";

import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { hashPassword, startSession } from "@/lib/session";
import { withTransaction } from "@/lib/transaction";

// new accounts are created by the system user
const SYSTEM_USER_ID = 1;

const MIN_PASSWORD_LENGTH = 8;

export type RegisterState = {
  error: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
} | null;

// Creates the user and their passenger row, signs them in, then opens My Trips.
export async function register(previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phoneTyped = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const typed = { firstName, lastName, email, phone: phoneTyped };

  // "+1 (713) 555-0100" -> "+17135550100" (the schema only allows digits and a leading +)
  const phone = phoneTyped === "" ? null : phoneTyped.replace(/[\s().-]/g, "");

  // same rules as the schema's constraints
  if (firstName === "" || lastName === "") return { error: "Enter your first and last name.", ...typed };
  if (firstName.length > 50 || lastName.length > 50) return { error: "Names can be at most 50 characters.", ...typed };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    return { error: "Enter a valid email address.", ...typed };
  }
  if (phone !== null && !/^\+?\d{7,15}$/.test(phone)) {
    return { error: "Enter a phone number of 7 to 15 digits, or leave it empty.", ...typed };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`, ...typed };
  }
  if (password !== confirm) return { error: "The two passwords don't match.", ...typed };

  // email and phone must be unused
  const [taken] = await db.query<RowDataPacket[]>(
    "SELECT email, phone_number FROM user WHERE email = ? OR phone_number = ?",
    [email, phone],
  );
  if (taken.some((row) => String(row.email).toLowerCase() === email.toLowerCase())) {
    return { error: "An account with that email already exists. Log in instead.", ...typed };
  }
  if (taken.length > 0) return { error: "That phone number is already on another account.", ...typed };

  // hash first so the transaction stays short
  const passwordHash = await hashPassword(password);
  let userId: number;
  try {
    userId = await withTransaction(async (conn) => {
      const [user] = await conn.query<ResultSetHeader>(
        `INSERT INTO user (email, phone_number, password_hash, loyalty_points,
                           created_by, created_at, updated_by, last_updated)
         VALUES (?, ?, ?, 0, ?, NOW(), ?, NOW())`,
        [email, phone, passwordHash, SYSTEM_USER_ID, SYSTEM_USER_ID],
      );
      await conn.query(
        `INSERT INTO passenger (user_id, first_name, last_name, created_by, created_at, updated_by, last_updated)
         VALUES (?, ?, ?, ?, NOW(), ?, NOW())`,
        [user.insertId, firstName, lastName, SYSTEM_USER_ID, SYSTEM_USER_ID],
      );
      return user.insertId;
    });
  } catch (error) {
    // taken in the meantime
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return { error: "That email or phone number is already on another account.", ...typed };
    }
    throw error;
  }

  await startSession(userId);
  redirect("/my-trips");
}
