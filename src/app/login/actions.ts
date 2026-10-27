"use server";

import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { checkPassword, endSession, startSession } from "@/lib/session";

// same message for both, so it doesn't reveal which emails have accounts
const WRONG_LOGIN = "That email and password don't match an account.";

export type CustomerLoginState = { error: string; email: string } | null;

export async function customerLogin(
  previousState: CustomerLoginState,
  formData: FormData,
): Promise<CustomerLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const keepLoggedIn = formData.get("keep_logged_in") === "on";

  const [users] = await db.query<RowDataPacket[]>("SELECT user_id, password_hash FROM user WHERE email = ?", [email]);

  if (users.length === 0 || !(await checkPassword(password, users[0].password_hash))) {
    return { error: WRONG_LOGIN, email };
  }

  await startSession(users[0].user_id, keepLoggedIn);
  redirect("/my-trips");
}

export async function signOut() {
  await endSession();
  redirect("/");
}
